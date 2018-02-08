'use strict';

const test = require('../tape');
const _ = require('lodash');

const hysteresis = require('../../src/libs/hysteresis');

test('Check most common hysteresis cases', (t) => {
  const check = hysteresis(22, 1);

  const cases = [
    {
      value: 22,
      result: true,
      msg: 'Value and setpoint the same, result should be true',
    },
    {
      value: 23,
      result: false,
      msg: 'Value higher then setpoint but inside the threshold, result should be false',
    },
    {
      value: 24,
      result: true,
      msg: 'Value higher then threshold, result should be true',
    },
    {
      value: 23,
      result: true,
      msg: 'Value decreases but inside the threshold, hysteresis should pass, because previous value was not in threshold.',
    },
  ];

  _.times(2, () => {
    for (const spec of cases) {
      t.equals(check(spec.value), spec.result, spec.msg);
    }
  });

  t.end();
});

test('Check hysteresis with threshold 2', (t) => {
  const check = hysteresis(22, 2);

  const cases = [
    {
      value: 22,
      result: true,
      msg: 'Value reach setpoint, should pass',
    },
    {
      value: 23,
      result: false,
      msg: 'Lower bounds of hysteresis threshold, result should be false',
    },
    {
      value: 24,
      result: false,
      msg: 'Higher bounds of hysteresis threshold, result should be false',
    },
    {
      value: 23,
      result: false,
      msg: 'Repeat same value inside threshold value should be false',
    },
    {
      value: 25,
      result: true,
      msg: 'Value higher then threshold, result should be true',
    },
    {
      value: 25,
      result: true,
      msg: 'Value from threshold, but previous not it threshold, result should be true',
    },
  ];

  for (const spec of cases) {
    t.equals(check(spec.value), spec.result, spec.msg);
  }

  t.end();
});

test('Check gotcha hysteresis cases', (t) => {
  const check = hysteresis(24, 1);

  const cases = [
    {
      value: 25,
      result: true,
      msg: 'Value higher then setpoint and inside the threshold, but no previous value present, should pass',
    },
    {
      value: 24,
      result: true,
      msg: 'Value same to setpoint, should pass',
    },
    {
      value: 25,
      result: false,
      msg: 'Value higher then setpoint and inside threshold, should block',
    },
  ];

  for (const spec of cases) {
    t.equals(check(spec.value), spec.result, spec.msg);
  }

  t.end();
});
