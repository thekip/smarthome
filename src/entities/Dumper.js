'use strict';

const FULL_CLOSED = 100;
const FULL_OPENED = 0;

class Dumper {
  /**
   *
   * @param {int} _port
   * @param {VavController} vavCtrl
     */
  constructor(_port, vavCtrl) {
    this._position = 0;
    this._vavCtrl = vavCtrl;
    this._port = _port;
  }

  get isClosed() {
    return this._position >= FULL_CLOSED;
  }

  get isOpened() {
    return this._position === FULL_OPENED;
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
    this._position = percent;
    this._vavCtrl.setDumperPosition(this._port, this._position);
  }

  getPosition() {
    return this._position;
  }
}

module.exports = Dumper;
