const assert = require('node:assert/strict')
const { shouldEnablePowerSaver: should } = require('../Model.js')
assert.equal(should(true, true, true, 0.199), true)
assert.equal(should(true, true, true, 0), true)
assert.equal(should(true, true, true, 0.20), false)
assert.equal(should(true, true, true, 0.21), false)
assert.equal(should(false, true, true, 0.1), false)
assert.equal(should(true, false, true, 0.1), false)
assert.equal(should(true, true, false, 0.1), false)
for (const fraction of [NaN, Infinity, -1, null, undefined, '0.1']) {
  assert.equal(should(true, true, true, fraction), false)
}
console.log('Power Saver tests passed')
