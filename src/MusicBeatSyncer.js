import { RecurringTimer, Timer } from "./Tools";

export default class MusicBeatSyncer {
  constructor() {
    this.beatInterval = null;
    this.halfBeatTarget = null;
    this.resetBeatTarget = null;

    this.beatFunction = null; //To call a function on a beat.
    this.beatFunctionPrestart = 0;
    this.beatFunctionTimeout = null;

    this.bpm = 0;
    this.progress = 0;
    this.totalTime = 0;
    this.curBeat = 0;
  }
  setHalfBeatTarget(targetFunction) {
    this.halfBeatTarget = targetFunction;
  }
  setResetBeatTarget(targetFunction) {
    this.resetBeatTarget = targetFunction;
  }
  setBPM(bpm) {
    this.bpm = bpm;
  }
  setProgress(progress) {
    this.progress = progress;
  }
  setTotalTime(time) {
    this.totalTime = time;
  }
  setBeatFunction(targetFunction, prestart = 0) {
    this.beatFunction = targetFunction;
    this.beatFunctionPrestart = prestart;
  }
  reset() {
    if (this.beatInterval) this.beatInterval.clear();
    if (this.beatFunctionTimeout) {
      this.beatFunctionTimeout.pause();
      this.beatFunctionTimeout = null;
    }
    if (this.resetBeatTarget) this.resetBeatTarget.call();
  }
  pause() {
    if (this.beatInterval) this.beatInterval.pause();
    if (this.beatFunctionTimeout) this.beatFunctionTimeout.pause();
  }
  resume() {
    if (this.beatInterval) this.beatInterval.resume();
    if (this.beatFunctionTimeout) this.beatFunctionTimeout.pause();
  }
  runBeat() {
    this.reset();

    let halfbeat = 60 / this.bpm / 2;
    this.curBeat = 0;
    let halfbeatMS = halfbeat * 1000;
    let totalTime = this.totalTime; // value in seconds

    let halfbeatPerc = 100 / (totalTime / halfbeat);

    //First call
    this.onHalfBeat();

    //Next call through interval
    this.beatInterval = new RecurringTimer(() => {
      this.curBeat++;
      this.progress += halfbeatPerc;
      this.onHalfBeat();

      let factor = 8;
      if (this.beatFunction) {
        if (this.curBeat % factor === 0) {
          let distance = -1;
          while (distance < 0) {
            distance = halfbeat * factor - this.beatFunctionPrestart;
            factor *= 2;
          }
          this.beatFunctionTimeout = new Timer(() => {
            this.beatFunction.call();
            this.beatFunction = null;
            this.beatFunctionPrestart = 0;
          }, distance * 1000);
        }
      }
    }, halfbeatMS);
  }
  resetBeatFunction() {
    if (!this.beatFunction) return;
  }
  onHalfBeat() {
    if (this.halfBeatTarget) this.halfBeatTarget.call(this, this.progress);
  }
}
