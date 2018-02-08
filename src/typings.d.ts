declare module 'modbus-rtu' {
  import Bluebird = require('bluebird');
  import SerialPort from 'serialport';

  export enum DATA_TYPES {
      INT,
      UINT,
      ASCII,
  }

  export interface ModbusMasterOptions {
    responseTimeout?: number;
    debug?: boolean;
  }
  export class ModbusMaster {
    constructor(serialPort: SerialPort, options?: ModbusMasterOptions)
    public readHoldingRegisters(slave: number, start: number, dataType?: DATA_TYPES | Function): Bluebird<number[]>;
    public writeSingleRegister(slave: number, register: number, value: number, retryCount?: number): Bluebird<void>;
  }
}

declare module 'modbus-rtu/lib/errors' {
  export class ModbusCrcError extends Error {}
  export class ModbusResponseTimeout extends Error {}
}
