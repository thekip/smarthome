import { EventSubscription } from './event-subscription';

type EventHandlerFn<T> = (this: EventEmitter<T>, message: T) => void;

export class EventEmitter<T = void> {
  private handlers: Array<EventHandlerFn<T>> = [];

  /**
   * Subscribe for some events. Example:
   *
   * ```
   * EventEmitter.some(this.eventChanged, this.eventInit).on(() => console.log('Changed or Init
   * emitted'))
   * ```
   */
  public static some(...events: Array<EventEmitter<any>>): EventEmitter<any> {
    const wrap = new EventEmitter();

    events.forEach((event) => {
      event.subscribe(wrap.emit.bind(wrap));
    });

    return wrap;
  }

  /**
   * Bind handler to this event
   */
  public subscribe(fn: EventHandlerFn<T>): EventSubscription {
    this.handlers.push(fn);
    return new EventSubscription(this.off.bind(this, fn));
  }

  /**
   * Bind handler which will be triggered just once
   */
  public subscribeOnce(fn: EventHandlerFn<T>): EventSubscription {
    const onceHandler = (message: T) => {
      fn.call(fn, message);
      this.off(onceHandler);
    };

    return this.subscribe(onceHandler);
  }

  /**
   * Remove handler
   */
  public off(fn: EventHandlerFn<T>): EventEmitter<T> {
    this.handlers.splice(this.handlers.indexOf(fn), 1);

    return this;
  }

  /**
   * Remove all handlers from current event
   */
  public clearHandlers(): EventEmitter<T> {
    this.handlers.length = 0;

    return this;
  }

  /**
   * Emit current event
   *
   * @returns {boolean} any callback called?
   */
  public emit(arg?: T): boolean {
    if (this.handlers.length === 0) {
      return false;
    }

    const handlers = this.handlers.slice(); // copy array to prevent mutating while executing

    handlers.forEach((handler) => {
      handler.call(this, arg);
    });

    return true;
  }
}
