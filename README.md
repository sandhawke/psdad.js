# psdad.js
[![NPM version][npm-image]][npm-url]

JavaScript implementation of [psdad](https://sandhawke.github.io/psdad/spec.html), for node.js or browsers

## Example

Example (in demo.js)

```js
const { mapper } = require('psdad')
const vocab = mapper()

class Circle { constructor (state) { Object.assign(this, state) } }
class Line   { constructor (state) { Object.assign(this, state) } }

vocab.add(Circle, 'There is a circle of radius [number radius] at position ([number x], [number y]).')
vocab.add(Line, 'There is a line from ([number x0], [number y0]) to ([number x1], [number y1]).')

const mydata =  [
  new Circle({radius: 1, x: 10, y: 20}),
  new Line({x0: 10, y0: 20, x1: 15, y1: 25}),
  new Circle({radius: 2, x: 15, y: 25}),
]

const str = vocab.stringify(mydata)
console.log(str)
/* =>
There is a circle of radius 1 at position (10, 20).

There is a line from (10, 20) to (15, 25).

There is a circle of radius 2 at position (15, 25).

*/

const mydata2 = vocab.parse(str)
console.log(mydata2)
/* =>
[ Circle { radius: 1, x: 10, y: 20 },
  Line { x0: 10, y0: 20, x1: 15, y1: 25 },
  Circle { radius: 2, x: 15, y: 25 } ]
*/
```

## Performance

Some quick tests show stringify() running about 1m objects per second,
and parse() running about about 150k objects per second.  That's not
as fast as the native JSON functions (maybe 50% of JSON on stringify
and 10% on parse), but it's still probably fast enough. The parsing is
all done with one compiled regexp. It will be interesting to see how
it's affect by having larger definitions and more classes.

[npm-image]: https://img.shields.io/npm/v/psdad.svg?style=flat-square
[npm-url]: https://npmjs.org/package/psdad
