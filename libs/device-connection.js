'use strict';
const MAX_ERROR_COUNT = 10;

class DeviceConnection {

  constructor() {
    this._errorCount = 0;
  }

  get online() {
    return this._errorCount <= MAX_ERROR_COUNT;
  }

  error() {
    this._errorCount++;
  }

  success() {
    this._errorCount = 0;
  }

}

module.exports = DeviceConnection;
