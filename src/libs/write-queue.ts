import Bluebird = require('bluebird');
import { ICancelableTask } from './retriable-action';

export class QueueMap {
  private map: {[queueId: number]: WriteQueue}  = {};

  constructor(
    private queueConstructor: () => WriteQueue,
  ) {}

  public add(queueId: number, task: ICancelableTask) {
    if (!this.map[queueId]) {
      this.map[queueId] = this.queueConstructor();
    }

    this.map[queueId].add(task);
  }

  get length(): number {
    return (Object.keys(this.map) as any).reduce((acc: number, key: number) => acc + this.map[key].length, 0);
  }
}

export class WriteQueue {
  private items: ICancelableTask[] = [];

  public add<T>(task: ICancelableTask<T>): Bluebird<T> {
    if (this.items.length) {
      this.items.forEach((t) => t.abort());
      this.items.length = 0;
    }

    this.items.push(task);
    const promise = task.start();
    promise.finally(() => {
      this.items = this.items.filter((item) => item !== task);
    });

    return promise;
  }

  get length(): number {
    return this.items.length;
  }
}
