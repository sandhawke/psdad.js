const test = require('tape')
const { mapper } = require('.')

class Person { constructor (state) { Object.assign(this, state) } }
class Circle { constructor (state) { Object.assign(this, state) } }
class Line { constructor (state) { Object.assign(this, state) } }

const shapes = [
  new Circle({ radius: 1, x: 10, y: 20 }),
  new Line({ x0: 10, y0: 20, x1: 15, y1: 25 }),
  new Circle({ radius: 2, x: 15, y: 25 })
]

test('simple non-linked people', t => {
  const m = mapper()
  m.add(Person, 'There is a person named [name].')
  const data = [
    new Person({ name: 'Avery' }),
    new Person({ name: 'Brook' }),
    new Person({ name: 'Casey' }),
    new Person({ name: 'Dylan' })
  ]

  const str = m.stringify(data)
  t.equal(str, 'There is a person named Avery.\n\nThere is a person named Brook.\n\nThere is a person named Casey.\n\nThere is a person named Dylan.\n\n')

  const out = m.parse(str)
  t.deepEqual(out, data)
  t.end()
})

test('quoting when needed', t => {
  const m = mapper()
  m.add(Person, 'There is a person named [name] who is cool.')
  const data = [
    new Person({ name: 'Avery who is cool.' })
  ]

  const str = m.stringify(data)
  t.equal(str, 'There is a person named "Avery who is cool." who is cool.\n\n')

  const out = m.parse(str)
  t.deepEqual(out, data)
  t.end()
})

test('more quotes', t => {
  const m = mapper()
  m.add(Person, 'There is a person named [name] who is cool.')
  const data = [
    new Person({ name: 'Avery who is cool.' }),
    new Person({ name: 'Avery who is "cool".' }),
    new Person({ name: 'Avery who is "cool" \\o/! .' })
  ]

  const str = m.stringify(data)
  // console.log('str %s', str)

  const out = m.parse(str)
  t.deepEqual(out, data)
  t.end()
})

test('number', t => {
  const m = mapper()

  m.add(Circle, 'There is a circle of radius [number radius] at position ([number x], [number y]).')
  m.add(Line, 'There is a line from ([number x0], [number y0]) to ([number x1], [number y1]).')

  const str = m.stringify(shapes)
  t.equal(str, 'There is a circle of radius 1 at position (10, 20).\n\nThere is a line from (10, 20) to (15, 25).\n\nThere is a circle of radius 2 at position (15, 25).\n\n')

  const shapes2 = m.parse(str)
  t.deepEqual(shapes2, shapes)
  t.end()
})

test('subject', t => {
  const m = mapper()
  m.add(Person, 'There is a person named [name], hereinafter refered to as [id].')
  m.add('[subject] is [number age] years old.')

  const data = [
    new Person({ name: 'Avery', age: 91 })
  ]

  /*
  const str = m.stringify(data)
  t.equal(str, 'There is a person named Avery, hereinafter refered to as a0.\n\n')

  const out = m.parse(str + 'a0 is 91 years old.')
  */
  const out = m.parse('There is a person named Avery, hereinafter refered to as a0. a0 is 91 years old.')
  t.deepEqual(out, data)
  t.end()
})
