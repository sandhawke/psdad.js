const debug = require('debug')(__filename.split('/').slice(-1).join())

/*
  Bi-Map with support for resolving forward references

*/
class ReferenceTable {
  constructor (options = {}) {
    this.idFor = new Map() // obj -> id
    this.objFor = new Map() // id -> obj
    this.forwardRefs = new Map() // id => Set([ {item,key}, ... ])
    this.seq = 0
    this.genid = options.genid || (() => ('a' + this.seq++))
    this.log = []
  }

  idForObject (value, genided) {
    debug('idForObject(%O, %O)', value, genided)
    let id = this.idFor.get(value)
    if (!id) {
      id = this.genid(value)
      // value.id = id
      this.idFor.set(value, id)
      this.objFor.set(id, value)
      if (genided) genided.add(value)
    }
    debug(' => %o', id)
    return id
  }

  /*
    sort of: item[key] = objectForId(id)

    BUT it handles forward references, too, so if we don't have the
    object yet, it will be set later, when we do.
  */
  setValueToId (item, key, id) {
    debug('setValueToId(%O, %O, %O)', item, key, id)
    let value = this.objFor.get(id)
    if (value) {
      debug('.. set to %o', value)
      item[key] = value
    } else {
      let frs = this.forwardRefs.get(id)
      if (!frs) {
        frs = new Set()
        this.forwardRefs.set(id, frs)
      }
      frs.add({ item, key })
      debug('.. forward refs = %o', frs)
    }
  }

  gotId (id, obj) {
    debug('gotId(%O, %O)', id, obj)
    const oldObj = this.objFor.get(id)
    if (oldObj !== undefined) {
      if (oldObj !== obj) {
        console.error('id %o was %o now %o', id, oldObj, obj)
        throw new Error('id redefined')
      }
      debug('..already had it')
      return
    }
    this.objFor.set(id, obj)
    this.idFor.set(obj, id)
    for (let { item, key } of this.forwardRefs.get(id) || []) {
      // in case item got instantiated, we can find it
      if (item._forwardTo) item = item._forwardTo
      debug('..doing fwd %O[%O] = %O', item, key, obj)
      item[key] = obj
      debug('..did   fwd %O[%O] = %O', item, key, obj)
      debug('..CONFIRMING, item=%O', item)
    }
    debug('..done fwd')
    this.forwardRefs.delete(id)
  }

  complete () {
    debug('fdw = %O', this.forwardRefs)
    for (const [id, refs] of this.forwardRefs.entries() || []) {
      if (id === '(ValueUnknown)') continue
      debug('.. %O', { id, refs })
      console.error('Warning: unresolved forward refs to %O: %O', id, refs)
    }
    debug('reftable.idFor: %o', this.idFor)
    debug('reftable.objFor: %o', this.objFor)
    debug('reftable.log: %o', this.log)
  }
}

module.exports = { ReferenceTable }
