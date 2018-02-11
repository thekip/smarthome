import { EventEmitter } from '../../libs/event-emitter';
import { ModbusAdapter, ThermostatModbusDto } from './modbus-adapter';
import { ThermostatRegister } from './registers';
import Bluebird = require('bluebird');

export const DEFAULT_SETPOINT = 24;

export class Thermostat {
  public enabled = false;
  public roomTemp: number = -1;
  public tempSetpoint = DEFAULT_SETPOINT;

  /**
   * Emits only if hardware data changed
   */
  public onChange = new EventEmitter();

  constructor(
    private adapter: ModbusAdapter,
  ) {
    adapter.onChange.subscribe((data) => this.handleThermostatChange(data));
  }

  private handleThermostatChange(data: ThermostatModbusDto) {
    this.enabled = data.enabled;
    this.tempSetpoint = data.tempSetpoint;
    this.roomTemp = data.roomTemp;

    this.onChange.emit();
  }

  public toString(): string {
    return `Enabled: ${this.enabled ? 'On' : 'Off'}; Setpoint: ${this.tempSetpoint} C; Room temp: ${this.roomTemp} C;`;
  }

  public setEnable(value: boolean): Bluebird<void> {
    this.enabled = !!value;
    return this.adapter.writeToThermostat(ThermostatRegister.ENABLED, this.enabled);

  }

  public setTempSetpoint(temp: number): Bluebird<void> {
    this.tempSetpoint = temp;
    return this.adapter.writeToThermostat(ThermostatRegister.TEMP_SETPOINT, temp);
  }
}
