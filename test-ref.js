const test = require('tape')
const { mapper } = require('.')

class Person { constructor (state) { Object.assign(this, state) } }

test(t => {
  const m = mapper()
  m.add(Person, 'Person [name] (id [id]) has mom [ref mom].')

  const a = new Person({ name: 'Avery' })
  const b = new Person({ name: 'Brook' })
  a.mom = b
        
  const str = m.stringify([a])
  t.equal(str, '')

  const out = m.parse(str)
  t.deepEqual(out, [])

  t.end()
})

test
