import { ModbusMaster } from 'modbus-rtu';
import { Promise } from 'bluebird';
import { DEFAULT_SETPOINT, Thermostat, ThermostatRegister } from './Thermostat';

type MockedModbusMaster = Partial<ModbusMaster> & {data: number[]};

function getModbusMasterMock(): MockedModbusMaster {
  const modbus: Partial<ModbusMaster> & {data: number[]} = {
    data: [165, 1, 1, 50, 52, 1, 0],
    readHoldingRegisters: () => {
      return new Promise((resolve) => {
        resolve(modbus.data);
      });
    },
    writeSingleRegister: jest.fn(() =>  new Promise((resolve) => {
        resolve();
      }),
    ),
  };

  return modbus;
}

describe('Thermostat',  () => {
  let modbus: MockedModbusMaster;
  let thermostat: Thermostat;

  beforeEach(() => {
    modbus = getModbusMasterMock();
    thermostat = new Thermostat(modbus as ModbusMaster, 1, true);
  });

  it('Thermostat object should receive changes from Modbus', async () => {
    expect(thermostat.enabled).toBeFalsy();
    expect(thermostat.roomTemp).toBeFalsy();
    expect(thermostat.tempSetpoint).toBe(DEFAULT_SETPOINT);

    await thermostat.update();

    expect(thermostat.enabled).toBeFalsy();
    expect(thermostat.roomTemp).toBe(25);
    expect(thermostat.tempSetpoint).toBe(DEFAULT_SETPOINT);
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

      modbus.data[ThermostatRegister.ROOM_TEMP] = 60;

      await thermostat.update();

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should NOT trigger event when the same state comes', async () => {
      await thermostat.update();
      await thermostat.update();

      expect(handler).toHaveBeenCalledTimes(1);
    });
  })
});
