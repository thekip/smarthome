'use strict';

function hysteresis(setpoint, threshold) {
  let previousValue;

  function inHysteresis(value) {
    return Math.abs(value - setpoint) <= threshold;
  }

  return function hysteresisCheck(value) {
    let result = true;

    if (value === setpoint || !previousValue) {
      console.log('value === setpoint', value, setpoint, previousValue);
      result = true;
    } else if (previousValue && inHysteresis(previousValue) && inHysteresis(value)) {
      console.log('previousValue', previousValue);
      result = false;
    } else {
      console.log('nothing', previousValue);
    }

    previousValue = value;

    return result;
  };
}

module.exports = hysteresis;
