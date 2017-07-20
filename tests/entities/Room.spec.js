'use strict';
const test = require('../tape');
const sinon = require('sinon');

const Room = require('./../../entities/Room');
const EMITTERS = require('./../../entities/Room').EMITTERS;
const AC_MODES = require('./../../entities/AcUnit').MODES;
const SimpleEvent = require('../../libs/simple-event');

/**
 *
 * @returns {Dumper}
 */
function getDumperMock() {
  const dumper = {
    opened: false,
    close: () => {
      dumper.opened = false;
    },
    open: () => {
      dumper.opened = true;
    },
  };

  return dumper;
}

/**
 *
 * @returns {Thermostat}
 */
function getThermostatMock() {
  const thermostat = {
    enabled: false,
    roomTemp: 28,
    tempSetpoint: 25,
    setEnable: sinon.spy((value) => {
      thermostat.enabled = value;
    }),
    setTempSetpoint: sinon.spy((value) => {
      thermostat.tempSetpoint = value;
    }),
    onChange: new SimpleEvent(),
    toString: () => {
      return 'TESTING';
    },
  };

  return thermostat;
}

function testSetter(t, property, value, thermostatMethod) {
  const thermostat = getThermostatMock();
  const dumper = getDumperMock();
  const room = new Room(thermostat, dumper);

  const callback = sinon.spy();
  room.onChange.bind(callback);

  room[property] = value;
  t.equals(room[property], value);

  t.ok(callback.calledWith({ emitter: EMITTERS.api }));
  t.ok(thermostat[thermostatMethod].calledOnce);

  t.end();
}

test('Should emit event, update thermostat when setpoint changed', (t) => {
  testSetter(t, 'tempSetpoint', 22, 'setTempSetpoint');
});

test('Should emit event, update thermostat when enabled changed', (t) => {
  testSetter(t, 'enabled', true, 'setEnable');
});

test('Should emit event when thermostat changed', (t) => {
  const thermostat = getThermostatMock();
  const dumper = getDumperMock();
  const room = new Room(thermostat, dumper);

  const callback = sinon.spy();
  room.onChange.bind(callback);

  thermostat.onChange.trigger();

  t.ok(callback.calledWith({ emitter: EMITTERS.thermostat }));
  t.end();
});

test('Should update dumper position when AC mode changed', (t) => {
  // todo implement
  t.end();
});

function testDumperControl(t, ac, cases) {
  const thermostat = getThermostatMock();
  const dumper = getDumperMock();

  const room = new Room(thermostat, dumper, ac);

  for (const spec of cases) {
    thermostat.enabled = spec.enabled;
    thermostat.roomTemp = spec.roomTemp;
    thermostat.tempSetpoint = spec.tempSetpoint;

    room.updateDumperPosition();

    t.equals(dumper.opened, spec.opened, spec.msg);
  }

  t.end();
}

test('Check dumper controlling in heating mode', (t) => {
  const ac = {
    mode: AC_MODES.HEAT,
  };

  const cases = [
    {
      enabled: true,
      roomTemp: 22,
      tempSetpoint: 25,
      opened: true,
      msg: 'Setpoint higher then ambient temp, room enabled, dumper should be opened',
    },
    {
      enabled: false,
      roomTemp: 22,
      tempSetpoint: 25,
      opened: false,
      msg: 'Room disabled, dumper should be closed',
    },
    {
      enabled: true,
      roomTemp: 25,
      tempSetpoint: 25,
      opened: false,
      msg: 'Setpoint and ambient temp are equals, room enabled, dumper should be closed',
    },
    {
      enabled: true,
      roomTemp: 26,
      tempSetpoint: 25,
      opened: false,
      msg: 'Setpoint lower then ambient temp, room enabled, dumper should be closed',
    },
  ];

  testDumperControl(t, ac, cases);
});

test('Check dumper controlling in cooling mode', (t) => {
  const ac = {
    mode: AC_MODES.COOL,
  };

  const cases = [
    {
      enabled: true,
      roomTemp: 25,
      tempSetpoint: 22,
      opened: true,
      msg: 'Setpoint lower then ambient temp, room enabled, dumper should be opened',
    },
    {
      enabled: false,
      roomTemp: 25,
      tempSetpoint: 22,
      opened: false,
      msg: 'Room disabled, dumper should be closed',
    },
    {
      enabled: true,
      roomTemp: 25,
      tempSetpoint: 25,
      opened: false,
      msg: 'Setpoint and ambient temp are equals, room enabled, dumper should be closed',
    },
    {
      enabled: true,
      roomTemp: 24,
      tempSetpoint: 25,
      opened: false,
      msg: 'Setpoint higher then ambient temp, room enabled, dumper should be closed',
    },
  ];

  testDumperControl(t, ac, cases);
});

test('Check with hysteresis', (t) => {
  const ac = {
    mode: AC_MODES.COOL,
  };

  const cases = [
    {
      enabled: false,
      roomTemp: 25,
      tempSetpoint: 24,
      opened: false,
      msg: 'Room disabled, should be closed',
    },
    {
      enabled: true,
      roomTemp: 25,
      tempSetpoint: 24,
      opened: true,
      msg: 'Room enable, but nothing was changed, should be opened',
    },
    {
      enabled: true,
      roomTemp: 22,
      tempSetpoint: 22,
      opened: false,
      msg: 'Ambient and setpoint the same, dumper should be closed',
    },
    {
      enabled: true,
      roomTemp: 23,
      tempSetpoint: 22,
      opened: false,
      msg: 'Ambient higher and inside the threshold, dumper should be closed',
    },
    {
      enabled: true,
      roomTemp: 24,
      tempSetpoint: 22,
      opened: true,
      msg: 'Ambient higher then threshold, dumper should be open',
    },
    {
      enabled: true,
      roomTemp: 23,
      tempSetpoint: 22,
      opened: true,
      msg: 'Ambient decreases but inside the the threshold, hysteresis should pass, dumper should be open',
    },
    {
      enabled: true,
      roomTemp: 22,
      tempSetpoint: 22,
      opened: false,
      msg: 'Ambient the same as setpoint, dumper should be closed',
    },
  ];

  testDumperControl(t, ac, cases);
});

test('Check few rooms hysteresis collision', (t) => {
  const ac = {
    mode: AC_MODES.COOL,
  };

  const thermostat1 = getThermostatMock();
  const thermostat2 = getThermostatMock();
  const dumper1 = getDumperMock();
  const dumper2 = getDumperMock();

  const room1 = new Room(thermostat1, dumper1, ac);
  const room2 = new Room(thermostat2, dumper2, ac);

  thermostat1.roomTemp = 25;
  thermostat2.roomTemp = 25;

  room1.tempSetpoint = 24;
  room2.tempSetpoint = 24;

  room1.updateDumperPosition();
  room2.updateDumperPosition();

  room1.enabled = true;
  room1.updateDumperPosition();
  t.ok(dumper1.opened);

  room2.enabled = true;
  room2.updateDumperPosition();
  t.ok(dumper2.opened);

  t.end();
});
