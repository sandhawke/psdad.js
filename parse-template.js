const XRegExp = require('xregexp')

function *parseTemplate (t) {
  // const re = /(?<literal>([^[]|"\["|'\[')*)|\[[^]]\]/imguy
  const re = /(?<literal>[^[]+)|\[(?<slot>.*?)\]/imguy
  let m
  let i = 0
  while ((m = re.exec(t))) {
    // console.log('\n\nmatch', m)
    const g = m.groups
    if (g.literal) {
      yield g.literal.trim()
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
  // console.log('parseTemplte(%o) = %o', t, [...parsed])
  console.log('re=%o', prepTemplate(t, count++))
}

x('hello world[foo][bar]baz')
x('hello world [ foo ] [bar]baz')
x('hello\nworld... [ foo ] [int bar]baz')
*/

function parseSlot (t) {
  const re = /^\s*((?<type>\w+)\s+)?(?<name>\w+)\s*(;.*)?$/
  const m = t.match(re)
  if (m) {
    return { type: m.groups.type, name: m.groups.name }
  } else {
    console.error('text=%o', t)
    throw new Error('bad variable declaration')
  }
}

function prepTemplate (t, index, varMap) {
  const out = []
  for (const part of parseTemplate(t)) {
    if (typeof (part) === 'string') {
      out.push(XRegExp.escape(part))
    } else {
      const groupName = 'var_' + index + '_' + part.count
      out.push('(?<' + groupName + '>.+?)')
      varMap[groupName] = part.name
    }
  }
  return { re: out.join('') }
}

function mergeTemplates (templates) {
  const re = []
  let index = 0
  const varMap = {}
  for (const t of templates) {
    const pt = prepTemplate(t, index, varMap)
    re.push('(?<t_' + index + '>' + pt.re + ')')
    index++
  }
  re.push('(?<ws>\\s+)')
  re.push('(?<junk>.+?)')
  return { re: re.join('|'), varMap }
}

const tt = [
  'Hello [string name]!',
//  'Goodbye [name]',
//  'I think you might be [age] years old.',
//'I\'m sure [name] is [age] years old.'
]

const merged = mergeTemplates(tt)
console.log('RESULT = %O', merged)

function parse (merged, text) {
  const re = new RegExp(merged.re, 'imguy')
  console.log('re=%o', re)
  while (true) {
    console.log('')
    const m = re.exec(text)
    if (!m) break
    // console.log('m=%o', m)
    if (m.groups.junk) {
      console.log('Junk %o', m.groups.junk)
      continue
    }
    if (m.groups.ws) {
      console.log('Whitespace %o', m.groups.ws)
      continue
    }
    const b = {}
    let tnum
    let line
    for (const [key, value] of Object.entries(m.groups)) {
      if (key.startsWith('t_')) {
        tnum = parseInt(key.slice(2))
        line = value
      }
      const varName = merged.varMap[key]
      if (varName) b[varName] = value
    }
    console.log('matched template %d text %o', tnum, line)
    console.log('  %o', b)
  }
  console.log('DONE, at pos', re.lastIndex, text.length)
}

// console.log('\n\n %o', parse(merged, 'Hello Sandro! Goodbye, you. Hm'))
// console.log('\n\n %o', parse(merged, 'x'))

console.log('\n\n %o', parse(merged, 'Hello s! Hello Fred!'))
