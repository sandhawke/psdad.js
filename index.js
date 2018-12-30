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

  *parse (text) {
    if (!this.mergedRE) {
      const re = syntax.mergeTemplates(this.templates)
      this.mergedRE = new RegExp(re, 'imgy')  // u prevents \-space ?!
    }
    for (const [t, b] of syntax.parse(this, text)) {
      yield t.local.input(b)
    }
  }

  parser () { // would return a transformStream from strings to objects
    // will need its own copy of mergedRE, since that holds state
    throw Error('not implemented')

    // the main trick here would be remembering where the junk
    // starts at the end of a parse, then keeping that stuff around to
    // prepend to the next chunk.  re.lastIndex makes that fairly easy.
  }

  stringify (items) {
    const out = []
    for (const item of items) {
      //console.log('stringify %O', item)
      const t = this.findTemplate(item)
      //console.log('.. using template %O', t)
      if (!t) throw Error('cant stringify object')
      const text = this.fill(t, item)
      //console.log('.. made text %O', text)
      out.push(text)
    }
    return out.join('\n\n')
  }

  findTemplate (item) {
    //console.log('ft', item)
    for (const t of this.templates) {
      if (t.local.output(item)) return t
    }
    return undefined
  }

  fill (t, item) {
    const out = []
    for (const part of t.parsed) {
      //console.log('part:', part)
      if (typeof part === 'string') {
        out.push(part)
      } else {
        let value = item[part.name]
        // if (value === undefined)    warn?  error?
        if (value === undefined) value = '(ValueUnknown)'
        out.push(value)
      }
    }
    return out.join('')
  }
}

function mapper (...args) {
  return new Mapper(...args)
}

module.exports = { Mapper, mapper }
