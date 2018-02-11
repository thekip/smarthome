import { DISABLED_VALUE, ENABLED_VALUE } from './modbus-adapter';
import { ThermostatRegister } from './registers';

export class ValueMapper {
  private static mappingsFrom: {[register: number]: (value: number) => any} = {
    [ThermostatRegister.ENABLED]: (value) => value === ENABLED_VALUE,
    [ThermostatRegister.TEMP_SETPOINT]: (value) => value / 2,
    [ThermostatRegister.ROOM_TEMP]: (value) => value / 2,
  };
  private static mappingsTo: {[register: number]: (value: number) => number} = {
    [ThermostatRegister.ENABLED]: (value) => !value ? DISABLED_VALUE : ENABLED_VALUE,
    [ThermostatRegister.TEMP_SETPOINT]: (value) => value * 2,
    [ThermostatRegister.ROOM_TEMP]: (value) => value * 2,
  };

  public static toModbus(register: number, value: any): number {
    return this.mappingsTo[register](value);
  }

  public static fromModbus<T>(register: number, value: number): T {
    return this.mappingsFrom[register](value);
  }
}
