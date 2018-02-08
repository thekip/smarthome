import { VavController } from './VavController';

const FULL_CLOSED = 100;
const FULL_OPENED = 0;

export class Dumper {
  private position = 0;

  constructor(
    private port: number,
    private vavCtrl: VavController,
  ) {}

  get isClosed() {
    return this.position >= FULL_CLOSED;
  }

  get isOpened() {
    return this.position === FULL_OPENED;
  }

  public close() {
    this.setPosition(100);
  }

  public open() {
    this.setPosition(0);
  }

  /**
   * Set dumper position in percent. 100% is fully closed
   */
  public setPosition(percent: number) {
    this.position = percent;
    this.vavCtrl.setDumperPosition(this.port, this.position);
  }

  public getPosition(): number {
    return this.position;
  }
}
