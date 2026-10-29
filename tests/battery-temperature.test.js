const assert = require('node:assert/strict')
const { parseBatteryTemperature } = require('../Model.js')

assert.equal(parseBatteryTemperature('  F75303_CPU: 40 C\n  Battery:      30 C\n  PECI: 49 C'), 30)
assert.equal(parseBatteryTemperature('Battery: 30.5 C\r\n'), 30.5)
assert.equal(parseBatteryTemperature('Battery: -5 °C'), -5)
assert.equal(parseBatteryTemperature('  local_f75397@4c: 45 C\n  cpu_f75303@4d: 45 C\n  battery_temp@b: 35 C\n  peci-temp: 54 C'), 35)
assert.equal(parseBatteryTemperature('battery_temp: 35 C'), 35)
assert.equal(parseBatteryTemperature('battery_temp@1A: 35.5 C'), 35.5)
for (const invalid of ['battery_temp@b: 255 C', 'battery_temp@b: -273 C', 'battery_temp@b: unavailable', 'battery_temp@b: 35 C error', 'cpu_f75303@4d: 45 C', 'battery_temp_other: 35 C']) {
  assert.equal(parseBatteryTemperature(invalid), null)
}
for (const invalid of ['', 'CPU: 30 C', 'Battery: unavailable', 'Battery: 255 C', 'Battery: -273 C', 'Battery: 30 C error', null]) {
  assert.equal(parseBatteryTemperature(invalid), null)
}
console.log('Battery temperature tests passed')
