import { pick } from 'lodash';
import { EventEmitter } from '../libs/event-emitter/event-emitter';
import { Log } from '../libs/log';
import { AcUnit, AcMode as AC_MODES } from './AcUnit';
import chalk from 'chalk';
import { Dumper } from './Dumper';
import { Thermostat } from './thermostat/Thermostat';

export enum RoomChangeEmitter {
  thermostat = 'thermostat',
  api = 'api',
}

export interface RoomChangeData {
  emitter: RoomChangeEmitter;
}

let id = 0;

export interface RoomDto {
  tempSetpoint: number;
  enabled: boolean;
  ambientTemp: number;
  sync: boolean;
  id: number;
  dumperOpened: boolean;
}

export class Room {
  public onChange = new EventEmitter<RoomChangeData>();
  public id = id++;
  public sync: boolean = false;

  constructor(
    private thermostat: Thermostat,
    public dumper: Dumper,
    private ac: AcUnit,
  ) {
    thermostat.onChange.subscribe(() => {
      this.onThermostatChange();
    });
  }

  public updateDumperPosition() {
    if (!this.enabled) {
      return this.dumper.close();
    }

    let position = 'close';

    if (this.ac.mode === AC_MODES.COOL) {
      position = (this.ambientTemp - this.tempSetpoint) <= 0 ? 'close' : 'open';
    }

    if (this.ac.mode === AC_MODES.HEAT) {
      position = (this.tempSetpoint - this.ambientTemp) <= 0 ? 'close' : 'open';
    }

    if (position === 'close') {
      this.dumper.close();
    } else {
      this.dumper.open();
    }
  }

  public get isActive() {
    return this.enabled && this.dumper.isOpened;
  }

  public get enabled() {
    return this.thermostat.enabled;
  }

  public set enabled(value) {
    if (this.enabled === value) {
      return;
    }

    this.thermostat.setEnable(value);

    this.onChange.emit({
      emitter: RoomChangeEmitter.api,
    });
  }

  public get ambientTemp() {
    return this.thermostat.roomTemp;
  }

  public get tempSetpoint() {
    return this.thermostat.tempSetpoint;
  }

  public set tempSetpoint(temp) {
    if (this.tempSetpoint === temp) {
      return;
    }

    this.thermostat.setTempSetpoint(temp);

    this.onChange.emit({
      emitter: RoomChangeEmitter.api,
    });
  }

  public getDto(): RoomDto {
    const dto: RoomDto = pick(this, ['tempSetpoint', 'enabled', 'ambientTemp', 'sync', 'id']) as any;
    dto.dumperOpened = this.dumper.isOpened;
    return dto;
  }

  public setDto(dto: Partial<RoomDto>) {
    Object.assign(this, dto);
  }

  private onThermostatChange() {
    Log.info(chalk.cyan(`Room: thermostat is updated! ${this.id}: ` + this.thermostat.toString()));

    this.onChange.emit({
      emitter: RoomChangeEmitter.thermostat,
    });
  }
}
