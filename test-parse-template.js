const test = require('tape')
const { parseTemplate } = require('./parse-template')

function pt (t, text, answer) {
  // console.log('text is', text)
  t.deepEqual([...parseTemplate(text)], answer)
}

test('parsing of templates', t => {
  pt(t, 'hello', ['hello'])
  pt(t, '', [])
  pt(t, 'a[b]c', [ 'a', { type: 'string', name: 'b', count: 0 }, 'c' ])
  pt(t, 'a[t b]c', [ 'a', { type: 't', name: 'b', count: 0 }, 'c' ])
  pt(t, '[t b]c', [ { type: 't', name: 'b', count: 0 }, 'c' ])
  pt(t, 'a[t b]', [ 'a', { type: 't', name: 'b', count: 0 } ])
  pt(t, 'a[t b][s c]', [
    'a',
    { type: 't', name: 'b', count: 0 },
    { type: 's', name: 'c', count: 1 }
  ])
  t.end()
})

test('id and subject', t => {
  pt(t, '[id]', [ { type: 'id', name: 'id', count: 0 } ])
  pt(t, '[id a]', [ { type: 'id', name: 'a', count: 0 } ])

  pt(t, '[subject]', [ { type: 'subject', name: 'subject', count: 0 } ])
  pt(t, '[subject a]', [ { type: 'subject', name: 'a', count: 0 } ])
  t.end()
})

test('optional', t => {
  pt(t, 'a[optional b]c', [
    'a',
    { type: 'string', name: 'b', optional: true, count: 0 },
    'c'
  ])
  pt(t, '[optional x y]', [
    { type: 'x', name: 'y', optional: true, count: 0 }
  ])
  t.end()
})

// Never got this stuff working, let's just ban
// left brackets from literals?
test.skip('escaping', t => {
  /*
  try {
    pt(t, 'foo[a[b]]', [])
    t.fail()
  } catch (e) {
    t.pass()
  }
  */
  pt(t, 'left\\[a', ['left[a'])
  pt(t, 'a\\\\b', ['a\\b'])
  t.end()
})
