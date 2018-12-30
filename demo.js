const { mapper } = require('psdad')

const m = mapper()    // maybe call it vocab?

class Circle {
  constructor (state) {
    Object.assign(this, state)
  }
}

class Line {
  constructor (state) {
    Object.assign(this, state)
  }
}

// maybe call it m.define(...)
m.add(Circle, 'There is a circle of radius [number radius] at position ([number x], [number y]).')
m.add(Line, 'There is a line from ([number x0], [number y0]) to ([number x1], [number y1]).')

const mydata =  [
  new Circle({radius: 1, x: 10, y: 20}),
  new Line({x0: 10, y0: 20, x1: 15, y1: 25}),
  new Circle({radius: 2, x: 15, y: 25}),
]
console.log('\n## mydata=\n%O', mydata)

const str = m.stringify(mydata)

console.log('\n## stringify(mydata)=\n%s', str)

const mydata2 = m.parse(str)

console.log('\n## parse(stringified(mydata))=\n%O', [...mydata2])

console.log('\n(Sorry, conversion back to number is not yet implemented')
