import { Room } from '../entities/Room';
import {acUpdateLogic as logic} from './ac-update-logic';
import { AcMode, AcUnit } from '../entities/AcUnit';

function getAcUnitMock(mode: AcMode) {
  let enabled = false;

  const ac: Partial<AcUnit> = {
    mode,
    get enabled() {
      return enabled;
    },
    setEnabled: jest.fn((value) => {
      enabled = value;
    }),
    setTempSetpoint: jest.fn(),
    setAmbientTemp: jest.fn(),
    resetControls: jest.fn(),
  };

  return ac as AcUnit;
}
function getRooms(active: boolean)  {
  const rooms: Array<Partial<Room>> = [
    {
      tempSetpoint: 24,
      ambientTemp: 25,
      isActive: active,
    },
    {
      tempSetpoint: 23,
      ambientTemp: 22,
      isActive: active,
    },
    {
      tempSetpoint: 26,
      ambientTemp: 25,
      isActive: active,
    },
  ];

  return rooms as Room[];
}

describe('Ac Update Logic', () => {
  it('Should enable AC unit only if there are active rooms', () => {
    const ac = getAcUnitMock(AcMode.COOL);
    const rooms = getRooms(true);

    logic(ac, rooms);
    expect(ac.setEnabled).toHaveBeenCalledWith(true);
  });

  it('Should disable AC unit when no active rooms', () => {
    const ac = getAcUnitMock(AcMode.COOL);
    const rooms = getRooms(false);

    logic(ac, rooms);
    expect(ac.setEnabled).toHaveBeenCalledWith(false);
  });

  it('Should call reset controls, if no active rooms', () => {
    const ac = getAcUnitMock(AcMode.COOL);
    const rooms = getRooms(false);

    logic(ac, rooms);
    expect(ac.resetControls).toHaveBeenCalled();
  });

  describe('In heating mode', () => {
    const ac = getAcUnitMock(AcMode.HEAT);
    const rooms = getRooms(true);

    logic(ac, rooms);

    it('should set AC setpoint to the highest setpoint from the rooms', () => {
      expect(ac.setTempSetpoint).toHaveBeenCalledWith(26);
    });

    it('should set AC ambient to the lowest ambient from the rooms', () => {
      expect(ac.setAmbientTemp).toHaveBeenCalledWith(22);
    });
  });

  describe('In cooling mode', () => {
    const ac = getAcUnitMock(AcMode.COOL);
    const rooms = getRooms(true);

    logic(ac, rooms);

    it('should set AC setpoint to the lowest setpoint from the rooms', () => {
      expect(ac.setTempSetpoint).toHaveBeenCalledWith(23);
    });

    it('should set AC ambient to the highest ambient from the rooms', () => {
      expect(ac.setAmbientTemp).toHaveBeenCalledWith(25);
    });
  });
});
