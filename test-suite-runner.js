const debug = require('debug')(__filename.split('/').slice(-1).join())
const test = require('tape')
const { TestCase } = require('./schema-for-tests')
const { mapper } = require('.')
const fs = require('fs')
const stringify = require('canonical-json')

const m = mapper()
m.add(TestCase)

function write() {
  const tests = [
    new TestCase({
      template: 'Hello, [string name].',
      document: 'Hello, Sandro.',
      json: '{\n  "name": "Sandro"\n}'
    })
  ]
  const str = m.stringify(tests)
  fs.appendFileSync('test-suite-echo.psdad', str)
}
write()

const text = fs.readFileSync('test-suite.psdad')
let counter = 1
for (const testCase of m.parse(text)) {
  console.error('test case %d, %o', counter, testCase)
  test('ts' + counter++, t => {
    const m = mapper()
    console.log('template=%o', testCase.template)
    m.add(Object, testCase.template)
    const out = m.parse(testCase.document)
    //const json = JSON.stringify(out, null, 2)
    debug('out= %O', out)
    // t.equal(json, testCase.json)
    t.end()
  })
}
if (counter === 1) console.error('no tests recognized in suite')
