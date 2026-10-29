function clampIndex(index, length) {
  if (length <= 0) return 0
  return Math.max(0, Math.min(length - 1, index))
}

function selectProfileIndex(index, delta, profiles) {
  var values = Array.isArray(profiles) ? profiles : []
  if (values.length === 0) return 0
  return clampIndex(index + delta, values.length)
}

function parseKeyValue(raw) {
  var next = {}
  var lines = String(raw || "").split("\n")
  for (var i = 0; i < lines.length; i++) {
    var idx = lines[i].indexOf("\t")
    if (idx <= 0) continue
    next[lines[i].substring(0, idx)] = lines[i].substring(idx + 1).trim()
  }
  return next
}

function parseProfiles(raw, previousIndex) {
  var lines = String(raw || "").split("\n")
  var list = []
  var active = ""
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].trim()
    if (!line) continue
    var parts = line.split("\t")
    list.push(parts[0])
    if (parts[1] === "1") active = parts[0]
  }
  return {
    profiles: list,
    activeProfile: active,
    profileIndex: clampIndex(previousIndex || 0, list.length)
  }
}

function parseChargeLimit(raw) {
  var text = String(raw || "")
  var maximum = text.match(/Maximum\s+(\d{1,3})\s*%/i)
  if (maximum) return Number(maximum[1])

  var percentages = text.match(/\d{1,3}\s*%/g)
  if (!percentages || percentages.length === 0) return -1
  return Number(percentages[percentages.length - 1].replace(/\D/g, ""))
}

function parseBatteryTemperature(raw) {
  // Match the named battery sensor, never a CPU/board sensor or an error value.
  var match = String(raw || "").match(/^\s*(?:Battery|battery_temp(?:@[0-9a-f]+)?):\s*(-?\d+(?:\.\d+)?)\s*(?:°\s*)?C\s*$/im)
  if (!match) return null
  var value = Number(match[1])
  return isFinite(value) && value >= -40 && value <= 100 ? value : null
}

function shouldRequestChargeLimit(currentLimit, desiredLimit, blockedTarget) {
  return currentLimit !== desiredLimit && blockedTarget !== desiredLimit
}

function keepBoostActive(requested, batteryFull) {
  return requested === true && batteryFull !== true
}

function shouldEnablePowerSaver(enabled, present, onBattery, fraction) {
  return enabled === true && present === true && onBattery === true
    && typeof fraction === "number" && isFinite(fraction)
    && fraction >= 0 && fraction < 0.20
}

function normalizeHibernateThreshold(value) {
  var threshold = Math.round(Number(value))
  return isFinite(threshold) ? Math.max(5, Math.min(30, threshold)) : 10
}

function shouldHibernate(enabled, present, onBattery, fraction, threshold, attempted) {
  return enabled === true && present === true && onBattery === true
    && typeof fraction === "number" && isFinite(fraction)
    && fraction >= 0 && fraction <= normalizeHibernateThreshold(threshold) / 100
    && attempted !== true
}

function clampChargeLimit(value) {
  var limit = Math.round(Number(value))
  if (!isFinite(limit)) return 80
  return Math.max(40, Math.min(100, limit))
}

function normalizeChargeLimitStep(value) {
  var step = Math.round(Number(value))
  return isFinite(step) && step > 0 ? Math.min(60, step) : 10
}

function stepChargeLimit(value, delta, step) {
  return clampChargeLimit(clampChargeLimit(value) + delta * normalizeChargeLimitStep(step))
}

function profileIcon(name) {
  if (name === "power-saver") return "󰌪"
  if (name === "balanced") return "󰊚"
  if (name === "performance") return "󰓅"
  return "󰂄"
}

function batteryFraction(device) {
  return device && device.isPresent ? Math.max(0, Math.min(1, device.percentage)) : 0
}

function chargeThresholdActive(device, onBattery, states) {
  var d = device || {}
  var s = states || {}
  if (!(d && d.isPresent && !onBattery)) return false

  var fraction = batteryFraction(d)
  if (d.state === s.Discharging) return false
  if (d.state === s.PendingCharge) return true
  if (d.state === s.FullyCharged && fraction < 0.99) return true
  if (d.state !== s.Charging || fraction >= 0.99) return false

  return Number(d.changeRate || 0) <= 0.2 || Number(d.timeToFull || 0) >= 8 * 60 * 60
}

function batteryIcon(device, onBattery, states) {
  var d = device || {}
  if (!d.isPresent) return ""

  var chargingIcons = ["󰢜", "󰂆", "󰂇", "󰂈", "󰢝", "󰂉", "󰢞", "󰂊", "󰂋", "󰂅"]
  var defaultIcons = ["󰁺", "󰁻", "󰁼", "󰁽", "󰁾", "󰁿", "󰂀", "󰂁", "󰂂", "󰁹"]
  var index = Math.max(0, Math.min(9, Math.floor(d.percentage * 10)))
  var threshold = chargeThresholdActive(d, onBattery, states)

  if (threshold) return defaultIcons[index]
  if (d.state === states.FullyCharged) return "󰂅"
  if (!onBattery) return chargingIcons[index]
  return defaultIcons[index]
}

function modeLabel(device, onBattery, states) {
  var d = device || {}
  if (!d.isPresent) return ""

  var percentage = d.isPresent ? d.percentage : 0
  if (chargeThresholdActive(d, onBattery, states)) return "Threshold"
  if (onBattery) return "On battery"
  if (!onBattery && percentage >= 1) return "Fully charged"
  return "Charging"
}

if (typeof module !== "undefined") {
  module.exports = {
    clampIndex: clampIndex,
    selectProfileIndex: selectProfileIndex,
    parseKeyValue: parseKeyValue,
    parseProfiles: parseProfiles,
    parseChargeLimit: parseChargeLimit,
    parseBatteryTemperature: parseBatteryTemperature,
    shouldRequestChargeLimit: shouldRequestChargeLimit,
    keepBoostActive: keepBoostActive,
    shouldEnablePowerSaver: shouldEnablePowerSaver,
    normalizeHibernateThreshold: normalizeHibernateThreshold,
    shouldHibernate: shouldHibernate,
    clampChargeLimit: clampChargeLimit,
    normalizeChargeLimitStep: normalizeChargeLimitStep,
    stepChargeLimit: stepChargeLimit,
    profileIcon: profileIcon,
    batteryFraction: batteryFraction,
    chargeThresholdActive: chargeThresholdActive,
    batteryIcon: batteryIcon,
    modeLabel: modeLabel
  }
}
