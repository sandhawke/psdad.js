// const debug = require('debug')(__filename.split('/').slice(-1).join())
const intoStream = require('into-stream')
const parseTemplate = require('./parse-template')
const parseData = require('./parse-data')
const { ReferenceTable } = require('./reftable')

class Mapper {
  constructor (options = {}) {
    this.templates = []
    this.varMap = {}
    this.genid = options.genid
  }

  add (local, text) {
    // if it's a class, treat that as shorthand for the obvious converters
    if (local.name &&
        local.prototype &&
        local.prototype.constructor &&
        local.prototype.constructor.name === local.name) {
      const AppClass = local
      local = {
        class: AppClass,
        input: x => new AppClass(x),
        output: x => x instanceof AppClass
      }
    }
    // look for the text attached to the class as a property or static method
    const def = local && local.class && local.class.definition
    if (text === undefined && def) {
      if (typeof def === 'function') {
        text = def(local.class)
      } else {
        text = def
      }
    }
    // OR just text, if it's a [subject] template
    if (text === undefined) {
      text = local
      local = undefined // this will be okay as long [subject] is found
    }

    const parsed = [...parseTemplate.parseTemplate(text)]
    const index = this.templates.length // gets coded into regexp
    const re = parseData.makeRE(parsed, index, this.varMap)
    const template = { local, text, parsed, re, index }
    this.templates.push(template)
    delete this.mergedRE
    // return template
  }

  //
  // Parsing
  //

  * parsedItems (text, reftable) {
    if (!this.mergedRE) {
      const re = parseData.mergeTemplates(this.templates)
      this.mergedRE = new RegExp(re, 'imgy') // u prevents \-space ?!
    }
    yield * parseData.parse(this, text, reftable)
  }

  parse (text) {
    const reftable = new ReferenceTable({ genid: this.genid })
    const result = [...this.parsedItems(text, reftable)]
    reftable.complete()
    return result
  }

  parser () { // would return a transformStream from strings to objects
    // will need its own copy of mergedRE, since that holds state
    throw Error('not implemented')

    // the main trick here would be remembering where the junk
    // starts at the end of a parse, then keeping that stuff around to
    // prepend to the next chunk.  re.lastIndex makes that fairly easy.
  }

  //
  // Serializing
  //

  streamify (items) {
    return intoStream(this.stringChunks(items))
  }

  stringify (items) {
    return [...this.stringChunks(items)].join('')
  }

  * stringChunks (items) {
    const reftable = new ReferenceTable({ genid: this.genid })
    for (const item of items) {
      yield * this.stringChunk1(item, reftable)
    }
  }

  * stringChunk1 (item, reftable) {
    // console.log('stringify %O', item)
    const t = this.findTemplate(item)
    // console.log('.. using template %O', t)
    if (!t) throw Error('cant stringify object')
    const needs = new Set()
    yield * this.fill(t, item, needs, reftable)
    yield ('\n\n')
    for (const prereq of needs) {
      yield * this.stringChunk1(prereq, reftable)
    }
  }

  findTemplate (item) {
    // console.log('ft', item)
    for (const t of this.templates) {
      if (t.local.output(item)) return t
    }
    return undefined
  }

  /*
    Given a template and an object of data, yield parts of string with the
    template filled in, using the fields of that object.

    - needs to be able to queue up things to be sent / first?
    - needs to flag which properties it used, so we can use other
      templates for some others.
  */
  * fill (t, item, needs, reftable) {
    for (const [index, part] of t.parsed.entries()) {
      // console.log('part:', part)
      if (typeof part === 'string') {
        yield part
      } else {
        let value
        if (part.type === 'id') {
          value = reftable.idForObject(item)
        } else {
          value = item[part.name]
        }
        // if (value === undefined)    warn?  error?
        if (value === undefined) value = '(ValueUnknown)'

        switch (typeof value) {
          case 'string':
            break
          case 'number':
          case 'boolean':
            value = '' + value
            break
          case 'object':
            if (part.type !== 'ref') {
              console.error('object value found in slot without "ref" type, slot=%O, value=%O', part, value)
            }
            value = reftable.idForObject(value, needs)
            break
          default:
            throw new Error('cant serialize: ' + JSON.stringify(value))
        }

        // does it need quoting?
        if (index + 1 === t.parsed.length || // last field, no delim
            value.indexOf(t.parsed[index + 1]) > -1 || // delim occurs in value
            value.indexOf('"') > -1 ||
            value.indexOf('\\') > -1) {
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
