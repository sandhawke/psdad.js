const syntax = require('./parse-template')

const templates = [
  { text: 'Hello [string name]!', code: 'hello' },
  { text: 'Goodbye [name].' , code: 'bye' },
  { text: 'I think you are [age] years old.', code: 'age1' },
  { text: 'I\'m sure [name] is [age] years old.', code: 'age2' }
]

const varMap = {}
let count = 0
for (const t of templates) {
  t.parsed = syntax.parseTemplate(t.text)
  t.index = count++
  t.re = syntax.makeRE(t.parsed, t.index, varMap)
}
const mergedRE = new RegExp(syntax.mergeTemplates(templates, varMap), 'imgy')
//console.log('RESULT = %O', merged)
console.log('\n\n %O', [...syntax.parse({mergedRE, varMap, templates}, 'Hello s! Hello Fred! Goodbye Silly. I think you are foo3 yours old. I think you are 23 years old.')])
