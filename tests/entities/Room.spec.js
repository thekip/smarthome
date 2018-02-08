'use strict';
const test = require('../tape');
const sinon = require('sinon');

const Room = require('../../src/entities/Room');
const EMITTERS = require('../../src/entities/Room').EMITTERS;
const AC_MODES = require('../../src/entities/AcUnit').MODES;
const SimpleEvent = require('../../src/libs/simple-event');

/**
 *
 * @returns {Dumper}
 */
function getDumperMock() {
  const dumper = {
    isOpened: false,
    close: () => {
      dumper.isOpened = false;
    },
    open: () => {
      dumper.isOpened = true;
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

test('Should be active only when enabled and dumper is open', (t) => {
  const thermostat = getThermostatMock();
  thermostat.enabled = true;
  const dumper = getDumperMock();
  const ac = {
    mode: AC_MODES.COOL,
  };

  const room = new Room(thermostat, dumper, ac);
  room.updateDumperPosition();

  t.ok(room.isActive, 'Thermostat enabled, dumper enabled');

  thermostat.enabled = false;
  room.updateDumperPosition();
  t.notOk(room.isActive, 'Thermostat disabled');

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

    t.equals(dumper.isOpened, spec.opened, spec.msg);
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
