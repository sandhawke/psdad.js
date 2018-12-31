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
  t.equal(str, 'Person Avery (id a0) has mom a1.\n\nPerson Brook (id a1) has mom (ValueUnknown).\n\n')

  const out = m.parse(str)
  t.deepEqual(out, [a, b])
  // do we want to somehow flag b as subordinate, by reference only?

  t.end()
})

test(t => {
  const m = mapper()
  m.add(Person, '[name] (person-[id]) knows person-[ref knows].')

  const a = new Person({ name: 'Avery' })
  const b = new Person({ name: 'Brook' })
  const c = new Person({ name: 'Casey' })
  a.knows = b
  b.knows = c
  c.knows = a

  const str = m.stringify([a])
  t.equal(str, 'Avery (person-a0) knows person-a1.\n\nBrook (person-a1) knows person-a2.\n\nCasey (person-a2) knows person-a0.\n\n')

  const out = m.parse(str)
  const [x, y, z] = out
  t.equal(x.knows, y)
  t.equal(y.knows, z)
  t.equal(z.knows, x)
  // t.deepEqual(out, [a,b,c])   can't handle cyclical structures

  t.end()
})
