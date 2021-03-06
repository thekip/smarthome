import { ModbusMaster } from 'modbus-rtu';
import { DeviceConnection } from '../libs/device-connection';
import { EventEmitter } from '../libs/event-emitter/event-emitter';
import { Log } from '../libs/log';
import { ModbusCrcError, ModbusResponseTimeout } from 'modbus-rtu/lib/errors';
import Bluebird = require('bluebird');

export const DEFAULT_SETPOINT = 24;

export const ThermostatRegister = {
  ENABLED: 0,
  FAN_SPEED: 1,
  MODE: 2,
  ROOM_TEMP: 3,
  TEMP_SETPOINT: 4,
  MANUAL_WEEKLY_PROG: 5,

  MINUTE_SECOND: 6,
  WEEK_HOUR: 7,
};

const ENABLED_VALUE = 165;
const DISABLED_VALUE = 90;

export class Thermostat {
  public enabled = false;
  public roomTemp: number = 0;
  public tempSetpoint = DEFAULT_SETPOINT;

  /**
   * Emits only if hardware data changed
   */
  public onChange = new EventEmitter();

  private currentData: number[] = [];
  private connection = new DeviceConnection();

  constructor(
    private modbusMaster: ModbusMaster,
    private modbusAddr: number,
    noWatch = false,
  ) {

    this.connection.onConnectionLost.subscribe((err) => {
      Log.error('Lost connection to thermostat ' + this.modbusAddr, 'Error:', err.message);
    });

    this.connection.onConnectionRestore.subscribe(() => {
      Log.error('Connection restored. Thermostat ' + this.modbusAddr);
    });

    if (!noWatch) {
      this.watch();
    }
  }

  public update(): Bluebird<number[]> {
    return this.modbusMaster.readHoldingRegisters(this.modbusAddr, 0, 6).then((data) => {
      this.connection.success();

      this.roomTemp = data[ThermostatRegister.ROOM_TEMP] / 2;
      if (this.currentData[ThermostatRegister.ROOM_TEMP] !== data[ThermostatRegister.ROOM_TEMP]) { // check, whether data is changed or not
        this.onChange.emit();
      }
      this.currentData = data.slice(0); // clone data array

      return data;
    }).catch(ModbusCrcError, ModbusResponseTimeout, (err: Error) => {
      this.connection.error(err);
      return [];
    });
  }

  public toString(): string {
    return `Room temp: ${this.roomTemp} C;`;
  }

  public setEnable(value: boolean): void {
    this.enabled = !!value;
    this.currentData[ThermostatRegister.ENABLED] = !value ? DISABLED_VALUE : ENABLED_VALUE;
  }

  public setTempSetpoint(temp: number): void {
    this.tempSetpoint = temp;
    this.currentData[ThermostatRegister.TEMP_SETPOINT] = temp * 2;
  }

  public watch(): void {
    this.update().finally(() => {
      setTimeout(() => {
        this.watch();
      }, 300);
    });
  }
}
