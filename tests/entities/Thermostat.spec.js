const test = require('../tape');
const sinon = require('sinon');
const Promise = require('bluebird');

const Thermostat = require('../../src/entities/Thermostat');
const DEFAULT_SETPOINT = require('../../src/entities/Thermostat').DEFAULT_SETPOINT;

function getModbusMasterMock() {
  const modbus = {
    data: [165, 1, 1, 50, 52, 1, 0],
    readHoldingRegisters: () => {
      return new Promise((resolve) => {
        resolve(modbus.data);
      });
    },
    writeSingleRegister: sinon.spy(() => {
      return new Promise((resolve) => {
        resolve();
      });
    }),
  };

  return modbus;
}

test('Thermostat should properly updates from Modbus', (t) => {
  const modbus = getModbusMasterMock();
  const thermostat = new Thermostat(modbus, 1, true);

  t.false(thermostat.enabled);
  t.equal(thermostat.roomTemp, null);
  t.equal(thermostat.tempSetpoint, DEFAULT_SETPOINT);

  thermostat.update().then(() => {
    t.false(thermostat.enabled);
    t.equal(thermostat.roomTemp, 25);
    t.equal(thermostat.tempSetpoint, DEFAULT_SETPOINT);

    t.end();
  });
});

test('Update() should trigger event when object filled first time', (t) => {
  t.plan(1);
  const modbus = getModbusMasterMock();
  const thermostat = new Thermostat(modbus, 1, true);

  thermostat.onChange.bind(() => {
    t.ok(true);
  });

  thermostat.update();
});

test('Update() should trigger event when data is changed', (t) => {
  const modbus = getModbusMasterMock();
  const thermostat = new Thermostat(modbus, 1, true);

  const callback = sinon.spy();
  thermostat.onChange.bind(callback);

  thermostat.update().then(() => {
    modbus.data[Thermostat.REGISTERS.ROOM_TEMP] = 60;

    thermostat.update().then(() => {
      t.true(callback.secondCall);
      t.end();
    });
  });
});
