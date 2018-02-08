const test = require('../tape');
/**
 * @type {Sinon.SinonStatic}
 */
const sinon = require('sinon');
const logic = require('../../src/logic/ac-update-logic').acUpdateLogic;
const MODES = require('../../src/entities/AcUnit').AcMode;

function getAcUnitMock(mode) {
  let enabled = false;

  return {
    mode,
    get enabled() {
      return enabled;
    },
    setEnabled: sinon.spy((value) => {
      enabled = value;
    }),
    setTempSetpoint: sinon.spy(),
    setAmbientTemp: sinon.spy(),
    resetControls: sinon.spy(),
  };
}
function getRooms() {
  return [
    {
      tempSetpoint: 24,
      ambientTemp: 25,
      isActive: true,
    },
    {
      tempSetpoint: 23,
      ambientTemp: 22,
      isActive: true,
    },
    {
      tempSetpoint: 26,
      ambientTemp: 25,
      isActive: true,
    },
  ];
}

test('Should enable AC unit only if there are active rooms', (t) => {
  const ac = getAcUnitMock();
  const rooms = getRooms();

  logic(ac, rooms);
  t.ok(ac.setEnabled.calledWith(true));

  rooms.forEach((room) => { room.isActive = false; });

  logic(ac, rooms);
  t.ok(ac.setEnabled.calledWith(false));
  t.ok(ac.resetControls.calledOnce, 'Should call reset controls, if no active rooms');

  t.end();
});

test('In heating mode should', (t) => {
  const ac = getAcUnitMock(MODES.HEAT);
  const rooms = getRooms();

  logic(ac, rooms);

  t.ok(ac.setTempSetpoint.calledWith(26), 'set AC setpoint to the highest setpoint from the rooms');
  t.ok(ac.setAmbientTemp.calledWith(22), 'set AC ambient to the lowest ambient from the rooms');

  t.end();
});

test('In cooling mode should', (t) => {
  const ac = getAcUnitMock(MODES.COOL);
  const rooms = getRooms();

  logic(ac, rooms);

  t.ok(ac.setTempSetpoint.calledWith(23), 'set AC setpoint to the lowest setpoint from the rooms');
  t.ok(ac.setAmbientTemp.calledWith(25), 'set AC ambient to the highest ambient from the rooms');

  t.end();
});
