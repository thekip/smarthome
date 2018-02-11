import { ModbusMaster } from 'modbus-rtu';
import { DeviceConnection } from '../libs/device-connection';
import { EventEmitter } from '../libs/event-emitter';
import { Log } from '../libs/log';
import { ModbusCrcError, ModbusResponseTimeout } from 'modbus-rtu/lib/errors';
import { RetriableAction } from '../libs/retriable-action';
import { QueueMap, WriteQueue } from '../libs/write-queue';
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

export const ENABLED_VALUE = 165;
export const DISABLED_VALUE = 90;

export class Thermostat {
  public enabled = false;
  public roomTemp: number = -1;
  public tempSetpoint = DEFAULT_SETPOINT;

  /**
   * Emits only if hardware data changed
   */
  public onChange = new EventEmitter();

  private currentData: number[] = [];
  private connection = new DeviceConnection();
  private writeQueues = new QueueMap( () => new WriteQueue());

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

      if (this.writeQueues.length) {
        // discard values from thermostat, if there are tasks
        return this.currentData;
      }

      this.roomTemp = data[ThermostatRegister.ROOM_TEMP] / 2;
      this.enabled = data[ThermostatRegister.ENABLED] === ENABLED_VALUE;
      this.tempSetpoint = data[ThermostatRegister.TEMP_SETPOINT] / 2;

      // check, whether data is changed or not
      if (this.isHwDataChanged(data)) {
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
    const modbusValue = !value ? DISABLED_VALUE : ENABLED_VALUE;
    this.currentData[ThermostatRegister.ENABLED] = modbusValue;
    this.writeToThermostat(9, modbusValue);

  }

  public setTempSetpoint(temp: number): void {
    this.tempSetpoint = temp;
    this.currentData[ThermostatRegister.TEMP_SETPOINT] = temp * 2;

    this.writeToThermostat(13, temp * 2);
  }

  public watch(): void {
    if (this.writeQueues.length) {
      setTimeout(this.watch.bind(this), 300);
      return;
    }
    this.update().finally(() => {
      setTimeout(this.watch.bind(this), 300);
    });
  }

  private writeToThermostat(register: number, value: number) {
    const retryAction = new RetriableAction(() => this.modbusMaster.writeSingleRegister(this.modbusAddr, register, value, 1), 50);
    this.writeQueues.add(register, retryAction);
  }

  private isHwDataChanged(data: number[]) {
    return (
      this.currentData[ThermostatRegister.ROOM_TEMP] !== data[ThermostatRegister.ROOM_TEMP] ||
      this.currentData[ThermostatRegister.ENABLED] !== data[ThermostatRegister.ENABLED] ||
      this.currentData[ThermostatRegister.TEMP_SETPOINT] !== data[ThermostatRegister.TEMP_SETPOINT]
    );
  }
}
