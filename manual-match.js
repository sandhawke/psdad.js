const debug = require('debug')(__filename.split('/').slice(-1).join())

/*
  Equivalent to merging the templates into a regexp and doing exec,
  but in steps we control, so that we can report why the match is
  failing to happen, and otherwise check that the regex is behaving as
  we expect.
*/

// this emulates the wonky internal state that RegExps have
class Matcher {
  constructor (mapper) {
    this.lastIndex = 0
    this.mapper = mapper
  }
  exec (text) {
    debug('================exec==============')
    const m = manualMatch(this.mapper, text.slice(this.lastIndex))
    if (m) this.lastIndex += m.usedLength
    return m
  }
}

function manualMatch (mapper, text) {
  debug('starting parse of text %o', text)
  // try each template, and use the one which matches to longest text
  const matched = []
  for (const [index, t] of mapper.templates.entries()) {
    const m = matchOne(t, text, index)
    if (m) {
      matched.push([m[0].length, t, m, index])
    }
  }
  if (matched.length) {
    const sorted = matched.sort((a,b) => a[0]-b[0])
    const longest = sorted[0]
    const match = longest[2]
    const index = longest[3]
    match.groups['t_' + index] = true // this is how RE.exec ids the template
    debug('returning match %O', match)
    return match
  }
  return null
}

const quotedStringRE = /^"([^"\\]|\\\"|\\)*"/ //eslint-disable-line

function matchOne(template, text, templateIndex) {
  const groups = {}
  let pos = 0
  for (const [index, part] of template.parsed.entries()) {
    function slotFilled (text) {
      debug('..slot %d filled with text %o', index, text)
      // this matches what makeRE names the group for this slot
      groups['var_' + templateIndex + '_' + index] = text
      pos += text.length
    }
    if (typeof part === 'string') {
      debug('looking for literal %o starting as pos=%d', part, pos)
      const at = text.indexOf(part, pos)
      if (at === -1) {
        debug('..not found, no match for this template')
        return null
      }
      if (at > pos) {
        debug('..found it by skipping %d chars (%o)', at - pos, text.slice(pos,at))
        if (index > 0) {
          debug('..which is not allowed in the middle of template')
          return null
        }
      }
      debug('..literal matched')
      pos = at + part.length
    } else {
      debug('looking for slot content starting at pos=%d', pos)
      if (text.charAt(pos) === '"') {
        debug('..it starts with a quotation character')
        const m = text.slice(pos).match(quotedStringRE)
        if (m) {
          debug('..it matches the quoted string regex')
          slotFilled(m[0])
        } else {
          throw new Error('unpaired quote character in input')
        }
      } else {
        const next = template.parsed[index + 1]
        if (next === undefined) {
          debug('..this a trailing slot, consumes all remaining input')
          slotFilled(text.slice(pos))
        } else if (typeof next === 'string') {
          const end = text.indexOf(next, pos)
          if (end === -1) {
            debug('..but terminating literal (%o) not found', next)
            return null
          }
          const result = text.slice(pos, end)
          debug('..matched content %o', result)
          slotFilled(result)
        } else {
          throw new Error('no delimiter between slots')
        }
      }
    }
  }    
  const result = [text]
  result.groups = groups
  result.usedLength = pos
  return result
}

module.exports = { manualMatch, Matcher }

