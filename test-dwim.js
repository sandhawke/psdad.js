const test = require('tape')
const { mapper } = require('.')

test('dwim args to mapper.add()', t => {
  const m = mapper()
  let out = []
  // hook addPair to see how it's called
  m.addPair = (...args) => { out.push(args) }

  out = []
  m.add({ input: 1, output: 2 },'x')
  t.deepEqual(out, [[{ input: 1, output: 2 }, 'x']])

  out = []
  m.add('x')
  t.deepEqual(out, [[null, 'x']])

  class MyClass {}
  MyClass.definition = 'x'
  out = []
  m.add(MyClass)
  // console.error('out = %O', out)
  {
    const [local, text] = out[0]
    t.equal(text, 'x')
    t.equal(local.class, MyClass)
    t.ok(local.input)
  }

  MyClass.definitions = ['x', 'y']
  out = []
  m.add(MyClass)
  t.equal(out.length, 2)
  {
    const [local, text] = out[0]
    t.equal(text, 'x')
    t.equal(local.class, MyClass)
    t.ok(local.input)
  }
  {
    const [local, text] = out[1]
    t.equal(text, 'y')
    t.equal(local.class, MyClass)
    t.ok(local.input)
  }

  out = []
  m.add(MyClass, 'z')
  {
    const [local, text] = out[0]
    t.equal(out.length, 1)
    t.equal(text, 'z')
    t.equal(local.class, MyClass)
    t.ok(local.input)
  }


  
  out = []
  try {
    m.add({ input: 1, output: 2 })
    t.fail()
  } catch (e) {
    t.pass()
  }

  t.end()
})

