import { EventEmitter } from '../libs/event-emitter';
import { AcMode, AcUnit } from './AcUnit';
import { Dumper } from './Dumper';
import { Room, RoomChangeEmitter } from './Room';
import { Thermostat } from './thermostat/Thermostat';

describe('Room', () => {
  function getDumperMock() {
    let isOpened = false;
    const dumper: Partial<Dumper> = {
      get isOpened() {
        return isOpened;
      },
      close: () => {
        isOpened = false;
      },
      open: () => {
        isOpened = true;
      },
    };

    return dumper as Dumper;
  }

  function getThermostatMock() {
    const thermostat: Partial<Thermostat> = {
      enabled: false,
      roomTemp: 28,
      tempSetpoint: 25,
      setEnable: jest.fn((value) => {
        thermostat.enabled = value;
      }),
      setTempSetpoint: jest.fn((value) => {
        thermostat.tempSetpoint = value;
      }),
      onChange: new EventEmitter(),
      toString: () => {
        return 'TESTING';
      },
    };

    return thermostat as Thermostat;
  }

  function testSetter(property: keyof Room, value: any, thermostatMethod: keyof Thermostat) {
    const thermostat = getThermostatMock();
    const dumper = getDumperMock();
    const room = new Room(thermostat as Thermostat, dumper as Dumper, {} as any);

    const handler = jest.fn();
    room.onChange.subscribe(handler);

    (room as any)[property] = value;
    expect(room[property]).toBe(value);

    expect(handler).toHaveBeenCalledWith({ emitter: RoomChangeEmitter.api });
    expect((thermostat[thermostatMethod] as any)).toHaveBeenCalledTimes(1);
  }

  it('When setpoint changed, should emit event and update thermostat ', () => {
    testSetter('tempSetpoint', 22, 'setTempSetpoint');
  });

  it('When `enabled` changed, should emit event and update thermostat ', () => {
    testSetter('enabled', true, 'setEnable');
  });

  test('Should emit event when thermostat changed', () => {
    const thermostat = getThermostatMock();
    const dumper = getDumperMock();
    const room = new Room(thermostat, dumper, {} as any);

    const handler = jest.fn();
    room.onChange.subscribe(handler);

    thermostat.onChange.emit();

    expect(handler).toHaveBeenCalledWith({ emitter: RoomChangeEmitter.thermostat });
  });

  test('Should be active only when thermostat enabled and dumper is open', () => {
    const thermostat = getThermostatMock();
    thermostat.enabled = true;
    const dumper = getDumperMock();
    const ac: Partial<AcUnit> = {
      mode: AcMode.COOL,
    };

    const room = new Room(thermostat, dumper, ac as AcUnit);
    room.updateDumperPosition();

    expect(room.isActive).toBeTruthy();

    thermostat.enabled = false;
    room.updateDumperPosition();
    expect(room.isActive).toBeFalsy();
  });

  interface DumperCase {
    enabled: boolean;
    roomTemp: number;
    tempSetpoint: number;
    expected: boolean;
    msg: string;
  }

  function testDumperControl(ac: AcUnit, cases: DumperCase[]) {
    const thermostat = getThermostatMock();
    const dumper = getDumperMock();

    const room = new Room(thermostat, dumper, ac);

    for (const spec of cases) {
      it(spec.msg, () => {
        thermostat.enabled = spec.enabled;
        thermostat.roomTemp = spec.roomTemp;
        thermostat.tempSetpoint = spec.tempSetpoint;

        room.updateDumperPosition();

        expect(dumper.isOpened).toBe(spec.expected);
      });
    }
  }

  describe('Dumper controlling in heating mode', () => {
    const ac: Partial<AcUnit> = {
      mode: AcMode.HEAT,
    };

    const cases: DumperCase[] = [
      {
        enabled: true,
        roomTemp: 22,
        tempSetpoint: 25,
        expected: true,
        msg: 'Setpoint higher then ambient temp, room enabled, dumper should be opened',
      },
      {
        enabled: false,
        roomTemp: 22,
        tempSetpoint: 25,
        expected: false,
        msg: 'Room disabled, dumper should be closed',
      },
      {
        enabled: true,
        roomTemp: 25,
        tempSetpoint: 25,
        expected: false,
        msg: 'Setpoint and ambient temp are equals, room enabled, dumper should be closed',
      },
      {
        enabled: true,
        roomTemp: 26,
        tempSetpoint: 25,
        expected: false,
        msg: 'Setpoint lower then ambient temp, room enabled, dumper should be closed',
      },
    ];

    testDumperControl(ac as AcUnit, cases);
  });

  describe('Dumper controlling in cooling mode', () => {
    const ac: Partial<AcUnit> = {
      mode: AcMode.COOL,
    };

    const cases: DumperCase[] = [
      {
        enabled: true,
        roomTemp: 25,
        tempSetpoint: 22,
        expected: true,
        msg: 'Setpoint lower then ambient temp, room enabled, dumper should be opened',
      },
      {
        enabled: false,
        roomTemp: 25,
        tempSetpoint: 22,
        expected: false,
        msg: 'Room disabled, dumper should be closed',
      },
      {
        enabled: true,
        roomTemp: 25,
        tempSetpoint: 25,
        expected: false,
        msg: 'Setpoint and ambient temp are equals, room enabled, dumper should be closed',
      },
      {
        enabled: true,
        roomTemp: 24,
        tempSetpoint: 25,
        expected: false,
        msg: 'Setpoint higher then ambient temp, room enabled, dumper should be closed',
      },
    ];

    testDumperControl(ac as AcUnit, cases);
  });

  it('should return DTO', () => {
    const thermostat = getThermostatMock();
    const dumper = getDumperMock();
    const room = new Room(thermostat, dumper, {} as any);

    expect(room.getDto()).toMatchSnapshot();
  });
});
