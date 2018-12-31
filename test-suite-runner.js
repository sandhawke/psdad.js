const debug = require('debug')(__filename.split('/').slice(-1).join())
const test = require('tape')
const { TestCase } = require('./schema-for-tests')
const { mapper } = require('.')
const fs = require('fs')
const jsonic = require('jsonic')

const tm = mapper()
tm.add(TestCase)

const text = fs.readFileSync('test-suite.psdad')
const tests = [...tm.parse(text)]

/* to manually add some in js syntax...
tests.push([
  new TestCase({
    template: 'Hello, [string name].',
    document: 'Hello, Sandro.',
    json: '{\n  "name": "Sandro"\n}'
  })
])
*/

const str = tm.stringify(tests)
fs.appendFileSync('test-suite-echo.psdad', str)

let counter = 0
for (const testCase of tests) {
  counter++
  console.error('test case %d, %o', counter, testCase)
  test('ts' + counter, t => {
    const m = mapper()
    console.log('template=%o', testCase.template)
    m.add(Object, testCase.template)
    const out = m.parse(testCase.document)

    const sfile = `out-suite/t${counter}-schema.js`
    const dfile = `out-suite/t${counter}-data.psdad`
    fs.writeFileSync(sfile, `
class X {}
X.definition = ${JSON.stringify(testCase.template)}
module.exports = {X}
`)
    fs.writeFileSync(dfile, testCase.document)
    t.comment(`RUN: check --schema ${sfile} ${dfile}`)
    const expected = jsonic(testCase.json)
    const o2 = Object.assign({}, out[0])
    delete o2._forwardTo // why is this here?   wtf.
    t.deepEqual(o2, expected)
    t.end()
  })
}
if (counter === 0) console.error('no tests recognized in suite')
