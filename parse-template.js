// welcome to the \[n]th circle of tarnation: escaping backslashes and brackets

const debug = require('debug')(__filename.replace(/.*\//, ''))
const templateSectionRE = /(?<literal>([^[])+)|\[(?<slot>.*?)\]/imguy
// const templateSectionRE = /(?<literal>[^[]+)|\[(?<slot>.*?)\]/imguy
function * parseTemplate (t) {
  let m
  let i = 0
  while ((m = templateSectionRE.exec(t))) {
    // //console.log('\n\nmatch', m)
    const g = m.groups
    if (g.literal) {
      let value = g.literal
      // value = value.replace(/(\\\[)/g, '[')
      // value = value.replace(/(\\\\)/g, '\\')
      debug('got literal: %o (%s)', value, value)
      yield value
    } else {
      const parsed = parseSlot(g.slot)
      parsed.count = i++
      yield parsed
    }
  }
}

// an optional type, a required name, extra parms
const slotRE = /^\s*(?<optional>optional\s+)?((?<type>\w+)\s+)?(?<name>\w+)\s*(,(?<parms>.*))?$/i

function parseSlot (decl) {
  const m = decl.match(slotRE)
  if (!m) {
    console.error('text=%o', decl)
    throw new Error('bad slot declaration')
  }

  let type = m.groups.type
  let name = m.groups.name
  let optional = !!m.groups.optional

  if (name === 'id' || name === 'subject') {
    if (type === undefined) {
      type = 'ref'
    } else if (type !== 'ref') {
      // console.error(m.groups)
      throw new Error('field names "id" and "subject" must be type "ref"')
    }
    // console.log('****OK', m.groups, {type, name})
  }
  if (type === undefined) type = 'string'

  // nicer to leave it out than set it to false, I think?
  const out = { type, name }
  if (optional) out.optional = true

  // console.log('****MORE', {type, name})
  return out
}

module.exports = { parseTemplate }
