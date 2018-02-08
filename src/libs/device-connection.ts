import { EventEmitter } from './event-emitter/event-emitter';
const MAX_ERROR_COUNT = 10;
const SimpleEvent = require('./simple-event');

/**
 * Service incapsulate connection state logic, and gives useful events when connection changed.
 */
export class DeviceConnection {
  public onConnectionLost = new EventEmitter<Error>();
  public onConnectionRestore = new EventEmitter();

  // by default treat as connection exist
  private previousStatus = true;
  private errorCount = 0;

  constructor(private maxErrorCount: number = MAX_ERROR_COUNT) {}

  public get online() {
    return this.errorCount < this.maxErrorCount;
  }

  public error(err: Error) {
    this.errorCount++;
    this.triggerEvents(err);
  }

  public success() {
    this.errorCount = 0;
    this.triggerEvents();
  }

  private triggerEvents(err?: Error) {
    if (this.previousStatus !== this.online) {
      if (this.online) {
        this.onConnectionRestore.emit();
      } else {
        this.onConnectionLost.emit(err);
      }
    }

    this.previousStatus = this.online;
  }
}
