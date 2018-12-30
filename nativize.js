/*
  Given the serialization of some value, convert it to a form the app
  expects, as declared in the template's slot declaration.

  This might grow to include range checking.

  In general, it can produce Validation Errors (TypeErrors for now),
  which are different from a template simply not matching.
*/

module.exports = (type, v) => {
  if (type === 'string')  return v
  
  if (type === 'number' || type === 'integer') {
    v = JSON.parse(v)
    if (typeof v !== 'number') throw new TypeError('expected number')

    if (type === 'integer') {
      if (v !== Math.round(v)) throw new TypeError('expected integer')
    }
    
    return v
  }

  if (type === 'boolean') {
    if (v.match(/true/i)) return true
    if (v.match(/false/i)) return false
    throw new TypeError('expected boolean')
  }
  
  throw new TypeError('unimplemented type: ' + JSON.stringify(type))
}
