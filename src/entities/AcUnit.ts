import { debounce, pick } from 'lodash';
import { ModbusMaster } from 'modbus-rtu';
import { ModbusCrcError, ModbusResponseTimeout } from 'modbus-rtu/lib/errors';
import { EventEmitter } from '../libs/event-emitter/event-emitter';

export interface AcUnitDto {
  enabled: boolean;
  mode: number;
  fanSpeed: number;
  tempSetpoint: number;
  ambientTemp: number;
}

export enum AcRegister {
  ENABLED = 0,
  UNIT_MODE = 1,
  FAN_SPEED = 2,
  TEMP_SETPOINT = 4,
  AMBIENT_TEMP_AC_UNIT = 5,
  AMBIENT_TEMP_EXTERNAL = 22,
  AC_ACTUAL_SETPOINT_TEMP = 23,
}

export const AMBIENT_TEMP_DEFAULT = -32768;

export enum AcMode {
  AUTO = 0,
  HEAT = 1,
  DRY = 2,
  FAN = 3,
  COOL = 4,
}

export class AcUnit {
  public enabled = false;
  public mode: AcMode = 0;
  public fanSpeed = 0;
  public tempSetpoint = 0;
  public ambientTemp = 0;

  // refer to documentation http://www.intesis.com/pdf/IntesisBox_ME_AC_MBS_1_manual_eng.pdf  p3.2.4
  public $ambientTempAcUnit = 0;
  public $actualSetpoint = 0;

  public onChange = new EventEmitter();
  private triggerChangeEvent = debounce(this.onChange.emit.bind(this.onChange));

  constructor(
    private modbusMaster: ModbusMaster,
    private modbusAddr: number,
  ) {
  }

  public update() {
    return this.modbusMaster.readHoldingRegisters(this.modbusAddr, 0, 24).then((data) => {
      this.enabled = !!data[AcRegister.ENABLED];
      this.mode = data[AcRegister.UNIT_MODE];
      this.fanSpeed = data[AcRegister.FAN_SPEED];
      this.tempSetpoint = data[AcRegister.TEMP_SETPOINT];
      this.ambientTemp = data[AcRegister.AMBIENT_TEMP_EXTERNAL];

      this.$actualSetpoint = data[AcRegister.AC_ACTUAL_SETPOINT_TEMP];
      this.$ambientTempAcUnit = data[AcRegister.AMBIENT_TEMP_AC_UNIT];
    }).catch(ModbusCrcError, ModbusResponseTimeout, () => {
      // do nothing
    });
  }

  public setMode(mode: AcMode) {
    if (this.mode === mode) {
      return;
    }
    this.mode = mode;
    return this.write(AcRegister.UNIT_MODE, mode);
  }

  public setTempSetpoint(setpoint: number) {
    if ((+this.tempSetpoint) === (+setpoint)) {
      return;
    }
    this.tempSetpoint = setpoint;
    return this.write(AcRegister.TEMP_SETPOINT, setpoint);
  }

  public resetControls() {
    this.setDefaultAmbientTemp();
  }

  public setAmbientTemp(temp: number) {
    if (this.ambientTemp === temp) {
      return;
    }
    this.ambientTemp = temp;
    return this.write(AcRegister.AMBIENT_TEMP_EXTERNAL, temp);
  }

  public setDefaultAmbientTemp() {
    return this.setAmbientTemp(AMBIENT_TEMP_DEFAULT);
  }

  public setEnabled(value: boolean) {
    if (this.enabled === value) {
      return;
    }
    this.enabled = value;
    return this.write(AcRegister.ENABLED, +value);
  }

  public toString() {
    return 'Status: ' + (this.enabled ? 'on' : 'off ') +
      '; Ambient temp: ' + this.ambientTemp + 'C; Setpoint: ' + this.tempSetpoint + 'C; \n\r' +
      'Real AC ambient temp: ' + this.$ambientTempAcUnit + 'C; Real AC setpoint: ' + this.$actualSetpoint + 'C;';
  }

  public getDto(): AcUnitDto {
    return pick(this, ['enabled', 'mode', 'fanSpeed', 'tempSetpoint', 'ambientTemp']) as any;
  }

  private write(reg: AcRegister, value: number) {
    this.triggerChangeEvent();
    return this.modbusMaster.writeSingleRegister(this.modbusAddr, reg, value);
  }
}
