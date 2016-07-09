'use strict';
const test = require('tape');
const sinon = require('sinon');
const Promise = require("bluebird");
const tapSpec = require('tap-spec');

const Room = require('./Room');
const MODES = require('./AcUnit').MODES;
const SimpleEvent = require('../libs/simple-event');

test.createStream()
  .pipe(tapSpec())
  .pipe(process.stdout);

function getDumperMock() {
  const dumper = {
    opened: false,
    close: () => {
      dumper.opened = false;
    },
    open: () => {
      dumper.opened = true;
    }
  };

  return dumper;
}

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
    }
  };

  return thermostat;
}

function getAcMock() {
  return {
    mode: MODES.COOL,
  }
}

function testSetter(t, property, value, thermostatMethod) {
  const thermostat = getThermostatMock();
  const dumper = getDumperMock();
  const room = new Room(thermostat, dumper);

  room._updateDumperPosition = sinon.spy();

  const callback = sinon.spy();
  room.onChange.bind(callback);

  room[property] = value;
  t.equals(room[property], value);

  t.ok(callback.calledWith({emitter: 'program'}));
  t.ok(thermostat[thermostatMethod].calledOnce);
  t.ok(room._updateDumperPosition.calledOnce);

  t.end();
}

test('Should emit event, update thermostat and update dumper position when setpoint changed', (t) => {
  testSetter(t, 'tempSetpoint', 22, 'setTempSetpoint');
});

test('Should emit event, update thermostat and update dumper position when enabled changed', (t) => {
  testSetter(t, 'enabled', true, 'setEnable');
});

test('Should emit event, and update dumper position when thermostat changed', (t) => {
  const thermostat = getThermostatMock();
  const dumper = getDumperMock();
  const room = new Room(thermostat, dumper);

  room._updateDumperPosition = sinon.spy();

  const callback = sinon.spy();
  room.onChange.bind(callback);

  thermostat.onChange.trigger();

  t.ok(callback.calledWith({emitter: 'thermostat'}));
  t.ok(room._updateDumperPosition.calledOnce);

  t.end();
});

test('Should update dumper position when AC mode changed', (t) => {
  //todo implement
  t.end();
});

function testDumperControl(t, ac, cases) {
  const thermostat = getThermostatMock();
  const dumper = getDumperMock();

  new Room(thermostat, dumper, ac);

  for(let spec of cases) {
    thermostat.enabled = spec.enabled;
    thermostat.roomTemp = spec.roomTemp;
    thermostat.tempSetpoint = spec.tempSetpoint;
    thermostat.onChange.trigger();

    t.equals(dumper.opened, spec.opened, spec.msg);
  }

  t.end();
}

test('Check dumper controlling in heating mode', (t) => {
  const ac = {
    mode: MODES.HEAT
  };

  const cases = [
    {
      enabled: true,
      roomTemp: 22,
      tempSetpoint: 25,
      opened: true,
      msg: 'Setpoint higher then ambient temp, room enabled, dumper should be opened'
    },
    {
      enabled: false,
      roomTemp: 22,
      tempSetpoint: 25,
      opened: false,
      msg: 'Room disabled, dumper should be closed'
    },
    {
      enabled: true,
      roomTemp: 25,
      tempSetpoint: 25,
      opened: false,
      msg: 'Setpoint and ambient temp are equals, room enabled, dumper should be closed'
    },
    {
      enabled: true,
      roomTemp: 26,
      tempSetpoint: 25,
      opened: false,
      msg: 'Setpoint lower then ambient temp, room enabled, dumper should be closed'
    }
  ];

  testDumperControl(t, ac, cases);
});

test('Check dumper controlling in cooling mode', (t) => {
  const ac = {
    mode: MODES.COOL
  };

  const cases = [
    {
      enabled: true,
      roomTemp: 25,
      tempSetpoint: 22,
      opened: true,
      msg: 'Setpoint lower then ambient temp, room enabled, dumper should be opened'
    },
    {
      enabled: false,
      roomTemp: 25,
      tempSetpoint: 22,
      opened: false,
      msg: 'Room disabled, dumper should be closed'
    },
    {
      enabled: true,
      roomTemp: 25,
      tempSetpoint: 25,
      opened: false,
      msg: 'Setpoint and ambient temp are equals, room enabled, dumper should be closed'
    },
    {
      enabled: true,
      roomTemp: 24,
      tempSetpoint: 25,
      opened: false,
      msg: 'Setpoint higher then ambient temp, room enabled, dumper should be closed'
    }
  ];

  testDumperControl(t, ac, cases);
});
