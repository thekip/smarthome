type deRegisterFn = () => void;
export class EventSubscription {
  private fns: deRegisterFn[];

  /**
   * @param {function} eventDeRegisterFunc
   */
  constructor(eventDeRegisterFunc: deRegisterFn) {
    this.fns = [eventDeRegisterFunc];
    this.dispose = this.dispose.bind(this);
  }

  /**
   * Dispose subscription. Unregister from all events in this subscription.
   * This function is auto bound with own context, you can pass it everywhere without extra bind.
   */
  public dispose(): this {
    this.fns.forEach((fn) => fn());

    this.fns.length = 0;
    return this;
  }

  /**
   * Add another subscription. To unsubscribe from all at once
   * @param {EventSubscription} subscription
   * @returns {EventSubscription} returns the same instance of subscription
   */
  public add(subscription: EventSubscription): this {
    this.fns = this.fns.concat(subscription.fns);
    return this;
  }
}
