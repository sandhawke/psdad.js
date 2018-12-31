
class TestCase { constructor (state) { Object.assign(this, state) } }
TestCase.definitions = [
  `Given this template: [string template]
and this input text: [string document]
jsonic result match: [string json].`,
  `Given this template: [string template]
and this input text: [string document]
the resulting object as canonical JSON with 2-space indenting should be:
[string json].`]
                        

module.exports = { TestCase }

// OR do JSON deep-equal.
