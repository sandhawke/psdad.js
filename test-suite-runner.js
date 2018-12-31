const test = require('tape')
const schema = require('./schema-for-tests')
const { mapper } = require('.')
const fs = require('fs')
const stringify = require('canonical-json')

const m = mapper()
m.add(schema.TestCase)
const text = fs.readFileSync('test-suite.psdad')
let counter = 1
for (const testCase of m.parse(text)) {
  test('ts' + counter, t => {
    const m = mapper()
    console.log('template=%o', testCase.template)
    m.add(Object, testCase.template)
    const out = m.parse(testCase.document)
    const json = stringify(out)
    t.equal(json, testCase.json)
    t.end()
  })
}
