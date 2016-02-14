'use strict';

var _ = require('lodash');

var FULL_CLOSED = 255;
var FULL_OPENED = 0;

class Dumper {
  constructor(_port, AnalogShield) {
    this._position = null;
    this._analogShield = AnalogShield;
    this._port = _port;
  }
  isClosed() {
    return this._position >= FULL_CLOSED;
  }

  isOpened() {
    return this._position == FULL_OPENED;
  }

  close() {
    this.setPosition(100);
  }

  open() {
    this.setPosition(0);
  }

  /**
   * Set dumper position in percent. 100% is fully closed
   * @param percent
   */
  setPosition(percent) {
    this._position = Math.round(FULL_CLOSED * percent / 100);
    this._analogShield.setAnalogOutput(this._port, this._position);
  }

  getPosition() {
    return (this._position / FULL_CLOSED) * 100;
  }
}

module.exports = Dumper;
