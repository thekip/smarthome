import { EventEmitter } from '../event-emitter';

describe('Libs: EventEmitter', () => {
  describe('basically', () => {
    let emitter;
    let firstHandler;
    let secondHandler;

    beforeEach(() => {
      emitter = new EventEmitter();
      firstHandler = jasmine.createSpy('first event handler');
      secondHandler = jasmine.createSpy('second event handler');
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
    const handler = jasmine.createSpy('event handler');

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
    const handler = jasmine.createSpy();

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
    const handler = jasmine.createSpy();

    emitter.subscribe(handler);

    barEvent.emit();
    bazEvent.emit();

    expect(handler).toHaveBeenCalledTimes(2);
  });

  describe('returned subscription', () => {
    let emitter;
    let handler;
    let subscription;

    beforeEach(() => {
      emitter = new EventEmitter();
      handler = jasmine.createSpy();
      subscription = emitter.subscribe(handler);
    });

    it('should allow to dispose itself', () => {
      subscription.dispose();

      emitter.emit();
      expect(handler).not.toHaveBeenCalled();
    });

    it('should allow concat with another subscription', () => {
      const emitterSecond = new EventEmitter();
      const handlerSecond = jasmine.createSpy();

      subscription.add(emitterSecond.subscribe(handlerSecond));

      subscription.dispose();

      emitter.emit();
      emitterSecond.emit();

      expect(handler).not.toHaveBeenCalled();
      expect(handlerSecond).not.toHaveBeenCalled();
    });

    it('should allow attach scope', () => {
      const scope = {
        $on: jasmine.createSpy(),
      };

      subscription.attachScope(scope);

      expect(scope.$on).toHaveBeenCalledWith('$destroy', subscription.dispose);
    });
  });
});

