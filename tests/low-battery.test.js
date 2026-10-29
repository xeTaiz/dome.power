const assert = require('node:assert/strict')
const { normalizeHibernateThreshold, shouldHibernate } = require('../Model.js')

assert.equal(normalizeHibernateThreshold(undefined), 10)
assert.equal(normalizeHibernateThreshold(0), 5)
assert.equal(normalizeHibernateThreshold(100), 30)
assert.equal(normalizeHibernateThreshold('11'), 11)
assert.equal(normalizeHibernateThreshold(NaN), 10)

assert.equal(shouldHibernate(true, true, true, 0.10, 10, false), true)
assert.equal(shouldHibernate(true, true, true, 0, 10, false), true)
assert.equal(shouldHibernate(true, true, true, 0.101, 10, false), false)
assert.equal(shouldHibernate(false, true, true, 0.09, 10, false), false)
assert.equal(shouldHibernate(true, false, true, 0.09, 10, false), false)
assert.equal(shouldHibernate(true, true, false, 0.09, 10, false), false)
assert.equal(shouldHibernate(true, true, true, 0.09, 10, true), false)
for (const invalid of [NaN, Infinity, -0.1, undefined, null, '0.09']) {
  assert.equal(shouldHibernate(true, true, true, invalid, 10, false), false)
}
console.log('Low-battery hibernation tests passed')
