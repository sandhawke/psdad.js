function * parseTemplate (t) {
  const re = /(?<literal>[^[]+)|\[(?<slot>.*?)\]/imguy
  let m
  let i = 0
  while ((m = re.exec(t))) {
    // //console.log('\n\nmatch', m)
    const g = m.groups
    if (g.literal) {
      yield g.literal
    } else {
      const parsed = parseSlot(g.slot)
      parsed.count = i++
      yield parsed
    }
  }
}

function parseSlot (decl) {
  if (decl === 'id') {
    return { type: 'id', name: 'id' }
  }
  const re = /^\s*((?<type>\w+)\s+)?(?<name>\w+)\s*(;.*)?$/
  const m = decl.match(re)
  if (m) {
    return { type: m.groups.type || 'string', name: m.groups.name }
  } else {
    console.error('text=%o', decl)
    throw new Error('bad variable declaration')
  }
}

module.exports = { parseTemplate }
