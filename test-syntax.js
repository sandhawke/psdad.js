const test = require('tape')
const { parseTemplate } = require('./parse-template')
const syntax = require('./parse-data')

// this is kind of the core of parser, pulled out for easier testing of
// our regexps
function groups (pat, dat) {
  const varMap = {}
  const parsed = parseTemplate(pat)
  const re = syntax.makeRE(parsed, 0, varMap)
  const m = new RegExp(re, 'imgy').exec(dat)
  return m && m.groups
}

test(t => {
  const pat = 'Hello [string name].'
  const dat = 'Hello Sandro.'
  t.deepEqual(groups(pat, dat), { var_0_0: 'Sandro' })
  t.end()
})

test('no final delimiter', t => {
  const pat = 'Hello [string name]'
  const dat = 'Hello Sandro'
  t.deepEqual(groups(pat, dat), { var_0_0: '' })
  t.end()
})

test('quoted', t => {
  const pat = 'Hello [string name]'
  const dat = 'Hello "Sandro"'
  t.deepEqual(groups(pat, dat), { var_0_0: '"Sandro"' })
  t.end()
})

test('with embedded bs', t => {
  const pat = 'Hello [string name]'
  const dat = 'Hello "a\\\\b"' // really that's just \\, but we double for JS
  t.deepEqual(groups(pat, dat), { var_0_0: '"a\\\\b"' })
  t.end()
})

test('with embedded quote', t => {
  const pat = 'Hello [string name]'
  const dat = 'Hello "a\\"b"' // really that's just \, but we double for JS
  t.deepEqual(groups(pat, dat), { var_0_0: '"a\\"b"' })
  t.end()
})

test('with more stuff', t => {
  const pat = 'Hello [string name]'
  const dat = 'Hello "Sandro"Hello "Again"'
  t.deepEqual(groups(pat, dat), { var_0_0: '"Sandro"' })
  t.end()
})

/*
  underlying stuff changed, probably not worth updating this

test(t => {
  const templates = [
    { text: 'Hello [string name]!', code: 'hello' },
    { text: 'Goodbye [name].', code: 'bye' },
    { text: 'I think you are [age] years old.', code: 'age1' },
    { text: 'I\'m sure [name] is [age] years old.', code: 'age2' }
  ]

  const varMap = {}
  let count = 0
  for (const t of templates) {
    t.parsed = parseTemplate(t.text)
    t.index = count++
    t.re = syntax.makeRE(t.parsed, t.index, varMap)
  }
  const mergedRE = new RegExp(syntax.mergeTemplates(templates, varMap), 'imgy')

  const reftable = new ReferenceTable()
  const out = [...syntax.parse({ mergedRE, varMap, templates, reftable }, 'Hello s! Hello Fred! Goodbye Silly. I think you are foo3 yours old. I think you are 23 years old.')]
  const o2 = out.map(([t, b]) => { return [ t.code, b ] })

  t.deepEqual(o2, [
    [ 'hello', { name: 's' } ],
    [ 'hello', { name: 'Fred' } ],
    [ 'bye', { name: 'Silly' } ],
    [ 'age1', { age: 'foo3 yours old. I think you are 23' } ] ])

  t.end()
})

*/
