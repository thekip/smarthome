import { Promise } from 'bluebird';
import { ModbusMaster } from 'modbus-rtu';
import {
  DEFAULT_SETPOINT, DISABLED_VALUE, ENABLED_VALUE, Thermostat,
  ThermostatRegister,
} from './';

type MockedModbusMaster = Partial<ModbusMaster> & { data: number[] };

function getModbusMasterMock(): MockedModbusMaster {
  const roomTemp = 25 * 2;
  const setpoint = 26 * 2;
  const modbus: Partial<ModbusMaster> & { data: number[] } = {
    data: [ENABLED_VALUE, 1, 1, roomTemp, setpoint, 1, 0],
    readHoldingRegisters: () => {
      return new Promise((resolve) => {
        resolve(modbus.data.slice(0));
      });
    },
    writeSingleRegister: jest.fn(() => new Promise((resolve) => {
        resolve();
      }),
    ),
  };

  return modbus;
}

describe('Thermostat', () => {
  let modbus: MockedModbusMaster;
  let thermostat: Thermostat;

  beforeEach(() => {
    modbus = getModbusMasterMock();
    thermostat = new Thermostat(modbus as ModbusMaster, 1, true);
  });

  it('Thermostat object should receive changes from Modbus', async () => {
    expect(thermostat).toMatchObject({
      enabled: false,
      roomTemp: -1,
      tempSetpoint: DEFAULT_SETPOINT,
    });

    await thermostat.update();

    expect(thermostat).toMatchObject({
      enabled: true,
      roomTemp: 25,
      tempSetpoint: 26,
    });
  });

  describe('Updating from modbus', () => {
    let handler: jest.Mock;

    beforeEach(() => {
      handler = jest.fn();
      thermostat.onChange.subscribe(handler);
    });

    it('should trigger event when initial state comes', async () => {
      await thermostat.update();
      expect(handler).toBeCalled();
    });

    it('should trigger event when state is changed', async () => {
      await thermostat.update();

      const watchedRegisters = [
        { register: ThermostatRegister.ROOM_TEMP, value: 30 * 2 },
        { register: ThermostatRegister.ENABLED, value: DISABLED_VALUE },
        { register: ThermostatRegister.TEMP_SETPOINT, value: 22 * 2 },
      ];

      for (const item of watchedRegisters) {
        modbus.data[item.register] = item.value;
        await thermostat.update();
      }

      expect(handler).toHaveBeenCalledTimes(watchedRegisters.length + 1);
    });

    it('should NOT trigger event when the same state comes', async () => {
      await thermostat.update();
      await thermostat.update();

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should consider changes via API', async () => {
      await thermostat.update();
      handler.mockReset();

      await thermostat.setEnable(false);
      modbus.data[ThermostatRegister.ENABLED] = DISABLED_VALUE;

      await thermostat.setTempSetpoint(30);
      modbus.data[ThermostatRegister.TEMP_SETPOINT] = 30 * 2;

      await thermostat.update();
      expect(handler).toHaveBeenCalledTimes(0);
    });
  });
});
