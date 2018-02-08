'use strict';
const MAX_ERROR_COUNT = 10;

const SimpleEvent = require('./simple-event');

/**
 * Service incapsulate connection state logic, and gives useful events when connection changed.
 */
class DeviceConnection {
  constructor(maxErrorCount) {
    // by default treat as connection exist
    this._previousStatus = true;
    this._errorCount = 0;
    this._maxErrorCount = maxErrorCount || MAX_ERROR_COUNT;
    this.onConnectionLost = new SimpleEvent();
    this.onConnectionRestore = new SimpleEvent();
  }

  get online() {
    return this._errorCount < this._maxErrorCount;
  }

  error(err) {
    this._errorCount++;
    this._triggerEvents(err);
  }

  success() {
    this._errorCount = 0;
    this._triggerEvents();
  }

  _triggerEvents(err) {
    if (this._previousStatus !== this.online) {
      if (this.online) {
        this.onConnectionRestore.trigger();
      } else {
        this.onConnectionLost.trigger(err);
      }
    }

    this._previousStatus = this.online;
  }
}

module.exports = DeviceConnection;
