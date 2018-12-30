const XRegExp = require('xregexp')

function *parseTemplate (t) {
  // const re = /(?<literal>([^[]|"\["|'\[')*)|\[[^]]\]/imguy
  const re = /(?<literal>[^[]+)|\[(?<slot>.*?)\]/imguy
  let m
  let i = 0
  while ((m = re.exec(t))) {
    // //console.log('\n\nmatch', m)
    const g = m.groups
    if (g.literal) {
      yield g.literal
    } else {
      const parsed = parseSlot(g.slot)
      parsed.count = i++
      yield parsed
    }
  }
}

/*
let count = 0
function x (t) {
  const parsed = parseTemplate(t)
  // //console.log('parseTemplte(%o) = %o', t, [...parsed])
  //console.log('re=%o', prepTemplate(t, count++))
}

x('hello world[foo][bar]baz')
x('hello world [ foo ] [bar]baz')
x('hello\nworld... [ foo ] [int bar]baz')
*/

function parseSlot (decl) {
  const re = /^\s*((?<type>\w+)\s+)?(?<name>\w+)\s*(;.*)?$/
  const m = decl.match(re)
  if (m) {
    return { type: m.groups.type, name: m.groups.name }
  } else {
    console.error('text=%o', decl)
    throw new Error('bad variable declaration')
  }
}

function makeRE (parsed, index, varMap) {
  const out = []
  for (const part of parsed) {
    if (typeof (part) === 'string') {
      out.push(XRegExp.escape(part))
    } else {
      const groupName = 'var_' + index + '_' + part.count
      // out.push('(?<' + groupName + '>.+?)')   // needs to be more restrictive or else repeated sentences gobble across boundaries
      out.push('(?<' + groupName + '>[^.,!]+?)')  // or quoted anything
      varMap[groupName] = part.name
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

/*
  WTF:

x = 'x\\ '
// => 'x\\ '
> new RegExp(x, 'imguy')
// => SyntaxError: Invalid regular expression: /x\ /: Invalid escape
new RegExp(x, 'imgy')
// => /\ /gimy

*/

function *parse (merged, text) {
  // {templates, varMap, mergedRE}

  // //console.log('re=%o', re)
  while (true) {
    //console.log('')
    const m = merged.mergedRE.exec(text)
    if (!m) break
    // //console.log('m=%o', m)
    if (m.groups.junk) {
      //console.log('Junk %o', m.groups.junk)
      continue
    }
    if (m.groups.ws) {
      //console.log('Whitespace %o', m.groups.ws)
      continue
    }
    const b = {}
    let tnum
    let line
    for (const [key, value] of Object.entries(m.groups)) {
      if (!value) continue // to unused ones are set to undefined
      if (key.startsWith('t_')) {
        tnum = parseInt(key.slice(2))
        line = value
      }
      const varName = merged.varMap[key]
      if (varName) b[varName] = value
    }
    // //console.log('matched template %d text %o', tnum, line)
    const t = merged.templates[tnum]
    //console.log('Got %s %o', t.code, b)
    yield [t, b]
  }
  //console.log('DONE, at pos', merged.mergedRE.lastIndex, text.length)
}

module.exports = { parseTemplate, makeRE, mergeTemplates, parse }
