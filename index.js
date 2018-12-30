const debug = require('debug')(__filename.split('/').slice(-1).join())
const intoStream = require('into-stream')
const syntax = require('./parse-template')

class Mapper {
  constructor () {
    this.templates = []
    this.varMap = {}
  }

  add (local, text) {
    // if it's a class, treat that as shorthand for the obvious converters
    if (local.name &&
        local.prototype &&
        local.prototype.constructor &&
        local.prototype.constructor.name === local.name) {
      const cls = local
      local = {
        class: cls,
        input: x => new cls(x),
        output: x => x instanceof cls
      }
    }
    // look for the text attached to the class as a property or static method
    const def = local.class.definition
    if (text === undefined && def) {
      if (typeof def === 'function') {
        text = def(local.class)
      } else {
        text = def
      }
    }
    
    const parsed = [...syntax.parseTemplate(text)]
    const index = this.templates.length // gets coded into regexp
    const re = syntax.makeRE(parsed, index, this.varMap)
    const template = { local, text, parsed, re, index }
    this.templates.push(template)
    delete this.mergedRE 
    // return template
  }

  *parsedItems (text) {
    if (!this.mergedRE) {
      const re = syntax.mergeTemplates(this.templates)
      this.mergedRE = new RegExp(re, 'imgy')  // u prevents \-space ?!
    }
    for (const [t, b] of syntax.parse(this, text)) {
      yield t.local.input(b)
    }
  }

  parse (text) {
    return [...this.parsedItems(text)]
  }

  parser () { // would return a transformStream from strings to objects
    // will need its own copy of mergedRE, since that holds state
    throw Error('not implemented')

    // the main trick here would be remembering where the junk
    // starts at the end of a parse, then keeping that stuff around to
    // prepend to the next chunk.  re.lastIndex makes that fairly easy.
  }

  streamify (items) {
    return intoStream(this.stringChunks(items))
  }

  stringify (items) {
    return [...this.stringChunks(items)].join('')
  }

  *stringChunks (items) {
    for (const item of items) {
      //console.log('stringify %O', item)
      const t = this.findTemplate(item)
      //console.log('.. using template %O', t)
      if (!t) throw Error('cant stringify object')
      yield* this.fill(t, item)
      yield('\n\n')
    }
  }

  findTemplate (item) {
    //console.log('ft', item)
    for (const t of this.templates) {
      if (t.local.output(item)) return t
    }
    return undefined
  }

  /*
    Given a template and an object of data, yield parts of string with the
    template filled in, using the fields of that object.
  */
  *fill (t, item) {
    for (const [index, part] of t.parsed.entries()) {
      //console.log('part:', part)
      if (typeof part === 'string') {
        yield part
      } else {
        let value = item[part.name]
        // if (value === undefined)    warn?  error?
        if (value === undefined) value = '(ValueUnknown)'

        switch (typeof value) {
        case 'string':
          break
        case 'number':
        case 'boolean':
          value = '' + value
          break
        default:
          throw new Error('cant serialize: ' + JSON.stringify(value))
        }

        // does it need quoting?
        if (index + 1 === t.parsed.length || // last field, no delim
            value.indexOf(t.parsed[index + 1]) > -1) { // delim occurs in value
          value = JSON.stringify(value) // is that the quoting we want? *shrug*
        }
        yield value
      }
    }
  }
}

function mapper (...args) {
  return new Mapper(...args)
}

module.exports = { Mapper, mapper }
