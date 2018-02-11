import { DISABLED_VALUE, ENABLED_VALUE } from './modbus-adapter';
import { ThermostatRegister } from './registers';
import { ValueMapper } from './value-mapper';

describe('Thermostat ValueMapper', () => {
  it('Should convert data received from Modbus', () => {
    expect(ValueMapper.fromModbus(ThermostatRegister.ENABLED, ENABLED_VALUE)).toBeTruthy();
    expect(ValueMapper.fromModbus(ThermostatRegister.ENABLED, DISABLED_VALUE)).toBeFalsy();
    expect(ValueMapper.fromModbus(ThermostatRegister.TEMP_SETPOINT, 50)).toBe(25);
    expect(ValueMapper.fromModbus(ThermostatRegister.ROOM_TEMP, 50)).toBe(25);
  });

  it('Should prepare data for Modbus', () => {
    expect(ValueMapper.toModbus(ThermostatRegister.ENABLED, true)).toBe(ENABLED_VALUE);
    expect(ValueMapper.toModbus(ThermostatRegister.ENABLED, false)).toBe(DISABLED_VALUE);
    expect(ValueMapper.toModbus(ThermostatRegister.TEMP_SETPOINT, 25)).toBe(50);
    expect(ValueMapper.toModbus(ThermostatRegister.ROOM_TEMP, 25)).toBe(50);
  });
});
