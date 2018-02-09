import { EventEmitter } from './event-emitter';
import { EventSubscription } from './event-subscription';
import _ from 'lodash';

describe('Libs: EventEmitter', () => {
  describe('basically', () => {
    let emitter: EventEmitter;
    let firstHandler: jest.Mock;
    let secondHandler: jest.Mock;

    beforeEach(() => {
      emitter = new EventEmitter();
      firstHandler = jest.fn();
      secondHandler = jest.fn();
      emitter.subscribe(firstHandler);
      emitter.subscribe(secondHandler);
    });

    it('should allow attach multiple event handlers', () => {
      emitter.emit();

      expect(firstHandler).toHaveBeenCalled();
      expect(secondHandler).toHaveBeenCalled();
    });

    it('should allow remove one of handlers', () => {
      emitter.off(firstHandler);

      emitter.emit();

      expect(firstHandler).not.toHaveBeenCalled();
      expect(secondHandler).toHaveBeenCalled();
    });

    it('should allow remove all handlers', () => {
      emitter.clearHandlers();
      emitter.emit();

      expect(firstHandler).not.toHaveBeenCalled();
      expect(secondHandler).not.toHaveBeenCalled();
    });
  });

  it('should trigger handler once if it registered via once()', () => {
    const event = new EventEmitter();
    const handler = jest.fn();

    event.subscribeOnce(handler);

    event.emit();
    event.emit();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should return flag from emit if there are handlers', () => {
    const event = new EventEmitter();

    expect(event.emit()).toBeFalsy();
    event.subscribe(_.noop);
    expect(event.emit()).toBeTruthy();
  });

  it('should properly work if another handler will be attached or removed inside an executing handler', () => {
    const emitter = new EventEmitter();
    const handler = jest.fn();

    emitter.subscribe(() => {
      emitter.off(handler);
    });

    emitter.subscribe(handler);

    emitter.emit();
    expect(handler).toHaveBeenCalled();
  });

  it('should emit event when some from passed is emitted', () => {
    const fooEvent = new EventEmitter();
    const barEvent = new EventEmitter();
    const bazEvent = new EventEmitter();

    const emitter = EventEmitter.some(fooEvent, barEvent, bazEvent);
    const handler = jest.fn();

    emitter.subscribe(handler);

    barEvent.emit();
    bazEvent.emit();

    expect(handler).toHaveBeenCalledTimes(2);
  });

  describe('returned subscription', () => {
    let emitter: EventEmitter;
    let handler: jest.Mock;
    let subscription: EventSubscription;

    beforeEach(() => {
      emitter = new EventEmitter();
      handler = jest.fn();
      subscription = emitter.subscribe(handler);
    });

    it('should allow to dispose itself', () => {
      subscription.dispose();

      emitter.emit();
      expect(handler).not.toHaveBeenCalled();
    });

    it('should allow concat with another subscription', () => {
      const emitterSecond = new EventEmitter();
      const handlerSecond = jest.fn();

      subscription.add(emitterSecond.subscribe(handlerSecond));

      subscription.dispose();

      emitter.emit();
      emitterSecond.emit();

      expect(handler).not.toHaveBeenCalled();
      expect(handlerSecond).not.toHaveBeenCalled();
    });
  });
});
