import { minBy, maxBy } from 'lodash';
import { AcUnit, AcMode as AC_MODES } from '../entities/AcUnit';
import { Room } from '../entities/Room';

export function acUpdateLogic(ac: AcUnit, rooms: Room[]) {
  const activeRooms = rooms.filter((room) => room.isActive);

  ac.setEnabled(activeRooms.length !== 0);

  if (ac.enabled) {
    if (ac.mode === AC_MODES.COOL) {
      ac.setTempSetpoint(Math.ceil((minBy(activeRooms, 'tempSetpoint') as Room).tempSetpoint));
      ac.setAmbientTemp(Math.floor((maxBy(activeRooms, 'ambientTemp') as Room).ambientTemp));
    } else if (ac.mode === AC_MODES.HEAT) {
      ac.setTempSetpoint(Math.ceil((maxBy(activeRooms, 'tempSetpoint') as Room).tempSetpoint));
      ac.setAmbientTemp(Math.ceil((minBy(activeRooms, 'ambientTemp') as Room).ambientTemp));
    }
  } else {
    ac.resetControls();
  }
}
