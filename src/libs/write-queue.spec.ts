import { Promise } from 'bluebird';
import { ICancelableTask } from './retriable-action';
import { QueueMap, WriteQueue } from './write-queue';

class MockedCancelableTask implements ICancelableTask {
  public resolve = () => {/**/};
  public reject = () => {/**/};

  private promise = new Promise((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });

  public start = jest.fn(() => this.promise);
  public abort = jest.fn();
}

function getWriteQueueStub(length = 0): Partial<WriteQueue> {
  return {
    add: jest.fn(),
    get length() {
      return length;
    },

  };
}

describe('QueueMap', () => {
  it('Should create new Queue when add a task with new queueId', () => {
    const queueConstructor = jest.fn(() => getWriteQueueStub());
    const map = new QueueMap(queueConstructor);

    const task = new MockedCancelableTask();

    map.add(1, task);
    map.add(2, task);

    expect(queueConstructor).toHaveBeenCalledTimes(2);
  });

  it('Should reuse existing queue when add task with the same queueId', () => {
    const queueConstructor = jest.fn(() => getWriteQueueStub());
    const map = new QueueMap(queueConstructor);

    const task = new MockedCancelableTask();

    map.add(1, task);
    map.add(1, task);

    expect(queueConstructor).toHaveBeenCalledTimes(1);
  });

  it('Should calculate length of all created queues', () => {
    let i = 0;
    const map = new QueueMap(() => getWriteQueueStub(3 + i++) as WriteQueue);

    const task = new MockedCancelableTask();

    map.add(1, task);
    map.add(2, task);

    expect(map.length).toBe(7);
  });
});

describe('WriteQueue', () => {
  it('Should start task when adding', () => {
    const task = new MockedCancelableTask();
    const queue = new WriteQueue();

    queue.add(task);

    expect(task.start).toHaveBeenCalled();
  });

  it('Should abort all pending task while adding new', () => {
    const task = new MockedCancelableTask();
    const secondTask = new MockedCancelableTask();
    const queue = new WriteQueue();

    queue.add(task);
    queue.add(secondTask);

    expect(task.abort).toHaveBeenCalled();
  });
  it('Initial length should be 0', () => {
    const queue = new WriteQueue();
    expect(queue.length).toBe(0);
  });

  it('Should return length of queue', () => {
    const task = new MockedCancelableTask();
    const queue = new WriteQueue();

    queue.add(task);

    expect(queue.length).toBe(1);
  });

  it('Should remove task from queue when task is finished', () => {
    const task = new MockedCancelableTask();
    const queue = new WriteQueue();

    const promise = queue.add(task).then(() => {
      expect(queue.length).toBe(0);

    });

    task.resolve();
    return promise;
  });
});
