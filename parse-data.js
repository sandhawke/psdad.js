const debug = require('debug')(__filename.split('/').slice(-1).join())
const nativize = require('./nativize')
const { escape } = require('xregexp')

function makeRE (parsed, index, varMap) {
  const out = []
  for (const part of parsed) {
    if (typeof (part) === 'string') {
      out.push(escape(part))
    } else {
      const groupName = 'var_' + index + '_' + part.count
      // here's a way we can type it without another doubling of the backslashes
      const term = /"([^"\\]|\\\"|\\)*"|[^"]*?/.source //eslint-disable-line
      out.push('(?<' + groupName + '>' + term + ')') // or quoted anything
      varMap[groupName] = part
    }
  }
  return out.join('')
}

function mergeTemplates (templates) {
  const re = []
  for (const t of templates) {
    re.push('(?<t_' + t.index + '>' + t.re + ')')
  }
  re.push('(?<ws>\\s+)')
  re.push('(?<junk>.+?)')
  return re.join('|')
}

function * parse (mapper, text, reftable) {
  // //console.log('re=%o', re)
  while (true) {
    // console.log('')
    const m = mapper.mergedRE.exec(text)
    if (!m) break
    // //console.log('m=%o', m)
    if (m.groups.junk) {
      // console.log('Junk %o', m.groups.junk)
      continue
    }
    if (m.groups.ws) {
      // console.log('Whitespace %o', m.groups.ws)
      continue
    }
    const b = {}
    let tnum
    let id
    let subject
    for (const [key, value] of Object.entries(m.groups)) {
      if (!value) continue // to unused ones are set to undefined
      if (key.startsWith('t_')) {
        tnum = parseInt(key.slice(2))
        // console.log('match line %o', line)
      }
      const slot = mapper.varMap[key]
      if (slot) {
        let v = value
        if (v.startsWith('"')) {
          // should only be possible if it's a fully quoted string
          v = JSON.parse(v)
        }
        if (slot.type === 'ref') {
          v = v.trim().toLowerCase()
          if (slot.name === 'id') {
            id = v
          } else if (slot.name === 'subject') {
            subject = v
          } else {
            reftable.setValueToId(b, slot.name, v)
            debug('after reftable.setValueToId %O', b)
          }
        } else {
          const native = nativize(slot.type, v)
          b[slot.name] = native
        }
      }
    }

    if (subject) {
      const ref = reftable.getObject(subject)
      if (!ref) throw Error('subject reference not found: ' + JSON.stringify(subject))
      debug('[subject] match, overlaying %O on %O', b, ref)
      Object.assign(ref, b)
      continue
    }

    // debug('matched template %d text %o', tnum, line)
    const t = mapper.templates[tnum]
    const newObj = t.local.input(b)
    b._forwardTo = newObj // so forward references can resolve
    // and how that the newObj is set, we can resolve references
    if (id) reftable.gotId(id, newObj)

    yield newObj
  }
  // console.log('DONE, at pos', mapper.mergedRE.lastIndex, text.length)
}

module.exports = { makeRE, mergeTemplates, parse }
