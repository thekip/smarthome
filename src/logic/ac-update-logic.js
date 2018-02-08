const AcUnit = require('../entities/AcUnit');
const _ = require('lodash');

/**
 * @param {AcUnit} ac
 * @param {Room[]} rooms
 */
function acUpdateLogic(ac, rooms) {
  const activeRooms = rooms.filter((room) => room.isActive);

  ac.setEnabled(activeRooms.length !== 0);

  if (ac.enabled) {
    if (ac.mode === AcUnit.MODES.COOL) {
      ac.setTempSetpoint(Math.ceil(_.minBy(activeRooms, 'tempSetpoint').tempSetpoint));
      ac.setAmbientTemp(Math.floor(_.maxBy(activeRooms, 'ambientTemp').ambientTemp));
    } else if (ac.mode === AcUnit.MODES.HEAT) {
      ac.setTempSetpoint(Math.ceil(_.maxBy(activeRooms, 'tempSetpoint').tempSetpoint));
      ac.setAmbientTemp(Math.ceil(_.minBy(activeRooms, 'ambientTemp').ambientTemp));
    }
  } else {
    ac.resetControls();
  }
}

module.exports = {
  acUpdateLogic,
};
