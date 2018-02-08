import { ModbusMaster } from 'modbus-rtu';

const DUMPER_REGISTERS = [0, 1, 2];
const EXHAUST_FAN_REG = 5;
const INTAKE_FAN_REG = 6;

export class VavController {
  public intakeFanEnabled = false;
  public exhaustFanEnabled = false;

  constructor(
    private modbusMaster: ModbusMaster,
    private modbusAddr: number,
  ) {}

  /**
   * Set value for 1-10 output port
   * @param adr port address
   * @param value 0-100
   */
  public setDumperPosition(adr: number, value: number) {
    return this.modbusMaster.writeSingleRegister(this.modbusAddr, DUMPER_REGISTERS[adr], value, 10);
  }

  public changeIntakeFanStatus(value: boolean) {
    this.intakeFanEnabled = value;
    return this.modbusMaster.writeSingleRegister(this.modbusAddr, INTAKE_FAN_REG, value ? 1 : 0, 10);
  }

  public changeExhaustFanStatus(value: boolean) {
    this.exhaustFanEnabled = value;
    return this.modbusMaster.writeSingleRegister(this.modbusAddr, EXHAUST_FAN_REG, value ? 1 : 0, 10);
  }
}
