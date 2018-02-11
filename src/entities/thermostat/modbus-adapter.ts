import { ModbusMaster } from 'modbus-rtu';
import { ModbusCrcError, ModbusResponseTimeout } from 'modbus-rtu/lib/errors';
import { DeviceConnection } from '../../libs/device-connection';
import { EventEmitter } from '../../libs/event-emitter';
import { Log } from '../../libs/log';
import { RetriableAction } from '../../libs/retriable-action';
import { QueueMap, WriteQueue } from '../../libs/write-queue';
import { ThermostatRegister } from './registers';
import { ValueMapper } from './value-mapper';
import Bluebird = require('bluebird');

export const ENABLED_VALUE = 165;
export const DISABLED_VALUE = 90;

export interface ThermostatModbusDto {
  roomTemp: number;
  enabled: boolean;
  tempSetpoint: number;
}

export class ModbusAdapter {
  private currentData: number[] = [];
  private writeQueues = new QueueMap(() => new WriteQueue());
  private connection = new DeviceConnection();

  /**
   * Emits only if hardware data changed
   */
  public onChange = new EventEmitter<ThermostatModbusDto>();

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

  public update() {
    return this.modbusMaster.readHoldingRegisters(this.modbusAddr, 0, 6).then((data) => {
      this.connection.success();

      if (this.writeQueues.length) {
        // discard values from thermostat, if there are tasks
        return this.currentData;
      }

      // check, whether data is changed or not
      if (this.isHwDataChanged(data)) {
        this.onChange.emit({
          enabled: ValueMapper.fromModbus<boolean>(ThermostatRegister.ENABLED, data[ThermostatRegister.ENABLED]),
          roomTemp: ValueMapper.fromModbus<number>(ThermostatRegister.ROOM_TEMP, data[ThermostatRegister.ROOM_TEMP]),
          tempSetpoint: ValueMapper.fromModbus<number>(ThermostatRegister.TEMP_SETPOINT, data[ThermostatRegister.TEMP_SETPOINT]),
        });
      }

      this.currentData = data.slice(0); // clone data array
    }).catch(ModbusCrcError, ModbusResponseTimeout, (err: Error) => {
      this.connection.error(err);
    });
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

  public writeToThermostat(register: number, value: any): Bluebird<void> {
    const modbusValue = ValueMapper.toModbus(register, value);
    const retryAction = new RetriableAction(() => this.modbusMaster.writeSingleRegister(this.modbusAddr, register + 9, modbusValue, 1), 50);
    return this.writeQueues.add(register, retryAction);
  }

  private isHwDataChanged(data: number[]) {
    return (
      this.currentData[ThermostatRegister.ROOM_TEMP] !== data[ThermostatRegister.ROOM_TEMP] ||
      this.currentData[ThermostatRegister.ENABLED] !== data[ThermostatRegister.ENABLED] ||
      this.currentData[ThermostatRegister.TEMP_SETPOINT] !== data[ThermostatRegister.TEMP_SETPOINT]
    );
  }
}
