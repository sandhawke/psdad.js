const fs = require('fs')
const { mapper } = require('psdad')

const m = mapper() // maybe call it vocab?

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

console.log('generating')
const mydata = [ ]
for (let i = 0; i < 1000000; i++) {
  mydata.push(new Circle({ radius: 1, x: 10, y: 20 }))
}
console.log('generated')

// fs.writeFileSync('out-circle.json', JSON.stringify(mydata))

fs.writeFileSync('out-circle.txt', m.stringify(mydata))

/*
-rw-rw-r-- 1 sandro sandro 26M Dec 29 23:58 out-circle.json
real 0m0.665s

-rw-rw-r-- 1 sandro sandro 51M Dec 30 00:02 out-circle.txt
real 0m1.187s

*/

/*
const str = m.stringify(mydata)
// real 0m1.001s

console.log('strung')

const mydata2 = [...m.parse(str)]
// 7.596s

console.log('parsed')
*/

const str = JSON.stringify(mydata)
// real 0m0.615

console.log('strung')

const mydata2 = JSON.parse(str)   //eslint-disable-line
// 0.919s

console.log('parsed')
