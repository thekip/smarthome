import Bluebird = require('bluebird');
import { Promise } from 'bluebird';

export interface ICancelableTask<T = any> {
  abort(): void;
  start(): Bluebird<T>;
}

export class RetriableAction<T> implements ICancelableTask {
  private aborted = false;

  constructor(
    private action: () => Bluebird<T>,
    private retryCount: number,
  ) {}

  public abort(): void {
    this.aborted = true;
  }

  private performAction(retry: number): Bluebird<T> {
    return new Promise((resolve, reject) => {
      if (retry <= 0) {
        throw Error('ModbusRetryLimitExceed');
      }

      this.action()
        .then(resolve)
        .catch((err) => {
          return this.performAction(--retry)
            .then(resolve)
            .catch(reject);
        });
    });
  }

  public start(): Bluebird<any> {
    return this.performAction(this.retryCount);
  }
}
