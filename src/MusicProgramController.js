import React from "react";
import { isMobile } from "react-device-detect";

import Vars from "./Vars";
import { Timer } from "./Tools";
import MusicBeatSyncer from "./MusicBeatSyncer";

/**
 *
 * Music ProgramController
 *
 * Retrieves the program of cues
 * Keep track of cues using time and cueIndex
 * Uses timeouts to trigger events on cues
 *
 * Instantiates the MusicBeatSyncer to trigger events on Beat
 *
 */
/**
 * TODO: To make more elegant and better overview,
 * codesplit the program part into MusicProgram.js
 * Also take the progress back into this
 *
 * */

export default class MusicProgramController extends React.Component {
  constructor(props) {
    super(props);
    this.setDefaults();

    //vars to compare difference
    this.prev_doStart = null;
    this.prev_userPause = null;
    this.prev_skipToPerc = null;
    this.prev_mixNow = null;

    this.mixNowPrestart = null;
    this.waitingToResumeBeat = null;

    this.beatInterval = null;
    this.actionTimeout = null;

    this.beatSyncer = new MusicBeatSyncer();
    this.beatSyncer.setHalfBeatTarget(this.props.onHalfBeat);
    this.beatSyncer.setResetBeatTarget(this.props.onResetBeat);
  }
  setDefaults() {
    this.cueIndex = 0;
    this.bpm = 0;
    this.hasStarted = false;
  }
  componentDidUpdate() {
    //Short vars for readability
    let p = this.props;
    let t = this;

    //DO START
    if (p.doStart !== t.prev_doStart) {
      this.prev_doStart = p.doStart;
      if (p.doStart) this.runProgram();
      else this.resetProgram();
    }
    //PAUSE
    if (p.userPause !== t.prev_userPause) {
      this.prev_userPause = p.userPause;
      if (p.userPause && this.actionTimeout) this.pauseProgram();
      else if (this.actionTimeout) this.resumeProgram();
    }
    //MIX NOW
    if (p.mixNow !== t.prev_mixNow) {
      this.prev_mixNow = p.mixNow;
      if (p.mixNow) this.askedMixNow();
    }
    //SKIP TO PERCENTAGE
    if (this.props.skipToPerc !== this.prev_skipToPerc) {
      this.prev_skipToPerc = this.props.skipToPerc;
      if (p.skipToPerc) {
        this.skipToPerc(p.skipToPerc);
        if (p.mixNow) this.recalcMixNow();
      } else if (this.waitingToResumeBeat) {
        //Vid is now re-buffered (cause skipToPerc is reset)
        this.waitingToResumeBeat = null;
        this.resumeProgram();
        this.beatSyncer.resume();
      }
    }
  }
  runProgram() {
    this.runNextCue();
  }
  resetProgram() {
    if (this.actionTimeout) this.actionTimeout.pause();
    this.beatSyncer.reset();
    this.setDefaults();
  }
  pauseProgram() {
    if (this.actionTimeout) this.actionTimeout.pause();
    this.beatSyncer.pause();
  }
  resumeProgram() {
    this.actionTimeout.resume();
    this.beatSyncer.resume();
  }
  planNextCue(timeToNext_ms) {
    if (this.actionTimeout) this.actionTimeout.pause();
    if (timeToNext_ms < 1) timeToNext_ms = 1;
    if (this.cueIndex < this.props.program.length) {
      this.actionTimeout = new Timer(() => this.runNextCue(), timeToNext_ms);
    }
  }
  runNextCue() {
    let program = this.props.program;
    let cue = program[this.cueIndex];

    if (cue) {
      //Action for the current cue
      let curTime = cue.absoluteCuetime;
      let timeToNext = 0;
      let cuetype = cue.cuetype_id;

      //Plan next
      this.cueIndex++;
      if (this.cueIndex < program.length) {
        timeToNext = program[this.cueIndex].absoluteCuetime - curTime;
        if (isMobile && cuetype === Vars.CT_PRE_OVER) timeToNext = 0;

        let programTime = timeToNext;
        if (cuetype === Vars.CT_SKIP_IN) programTime = 0;
        this.planNextCue(programTime * 1000);
      } else {
        this.props.onPlaylistFinished();
      }

      //Use action for BeatSync
      if (cue.cuetype_id === Vars.CT_START) {
        this.totalTime = this.calculateTotalTime(cue.song.cues);
        this.bpm = Number(cue.song.bpm);
        this.beatSyncer.setTotalTime(this.totalTime);
        this.beatSyncer.setBPM(this.bpm);
        this.beatSyncer.setProgress(0);
        this.beatSyncer.runBeat();
      }
      //Send action up
      this.props.onProgramAction(cue, timeToNext);
    }
  }

  /**
   *
   * USER INTERACTION
   *
   */
  askedMixNow() {
    //Skip to first PRESTART or STOP
    let prog = this.props.program;
    let nextCueIndex = this.cueIndex;
    while (
      prog[nextCueIndex].cuetype_id !== Vars.CT_PRE_OVER &&
      prog[nextCueIndex].cuetype_id !== Vars.CT_STOP &&
      nextCueIndex < prog.length - 1
    ) {
      nextCueIndex++;
    }

    //But nicely in the beat
    let prestart = 0;
    if (prog[nextCueIndex].cuetype_id === Vars.CT_PRE_OVER) {
      let cur = prog[nextCueIndex].absoluteCuetime;
      let next = prog[nextCueIndex + 1].absoluteCuetime;
      prestart = this.twoDecimals(next - cur);
    }

    this.beatSyncer.setBeatFunction(() => this.mixNow(nextCueIndex), prestart);
  }
  recalcMixNow() {
    //When skipToPerc, while still mixing: recalc using new progress
    this.beatSyncer.resetBeatFunction();
  }
  mixNow(nextCueIndex) {
    this.cueIndex = nextCueIndex;
    this.planNextCue(0);
    this.props.onMixNow();
  }
  skipToPerc(perc) {
    let prog = this.props.program;

    //Calculate newPerc, aligned nicely with beat
    let timeFromStart_sec = (this.totalTime * perc) / 100;
    let beatStep_sec = (60 / this.bpm) * 8;
    let amountOfBeats = Math.floor(timeFromStart_sec / beatStep_sec);
    let newTime_sec = amountOfBeats * beatStep_sec;
    let newPerc = (100 / this.totalTime) * newTime_sec;
    newPerc = this.twoDecimals(newPerc);

    //Calculate new absoluteTime
    let startCue = this.findMyCue(this.cueIndex - 1, Vars.CT_START);
    let stopCue = this.findMyCue(this.cueIndex - 1, Vars.CT_STOP);
    let skipIn = this.findMyCue(this.cueIndex - 1, Vars.CT_SKIP_IN);
    let skipOut = this.findMyCue(this.cueIndex - 1, Vars.CT_SKIP_OUT);
    let songLength = stopCue.cuetime - startCue.cuetime;
    if (skipIn && skipOut) songLength -= skipOut.cuetime - skipIn.cuetime;
    let relativeTime = newPerc * (songLength / 100);
    let curAbsoluteTime = startCue.absoluteCuetime + relativeTime;

    //Calculate new cueIndex
    let newCueIndex = 0;
    while (prog[newCueIndex].absoluteCuetime <= curAbsoluteTime) {
      newCueIndex++;
    }
    //Calculate new cue and vidTime
    let timeToNextCue = prog[newCueIndex].absoluteCuetime - curAbsoluteTime;
    let newVidTime = Math.round(startCue.cuetime + newTime_sec);
    if (skipIn && skipOut && curAbsoluteTime >= skipIn.absoluteCuetime) {
      timeToNextCue -= skipOut.cuetime - skipIn.cuetime;
      newVidTime += skipOut.cuetime - skipIn.cuetime;
    }

    //NOW APPLY
    this.cueIndex = newCueIndex;
    this.beatSyncer.setProgress(newPerc);
    this.beatSyncer.pause();
    this.planNextCue(timeToNextCue * 1000);
    this.pauseProgram();
    this.waitingToResumeBeat = true;
    this.props.onSkipTo(newVidTime);
  }

  /**
   *
   * OTHER
   *
   */
  twoDecimals(number) {
    return Math.round(Number(number) * 100) / 100;
  }
  getCueTime(cues, cuetype_id) {
    let ct =
      cues[cues.findIndex(cue => Number(cue.cuetype_id) === cuetype_id)]
        .cuetime;
    return this.twoDecimals(ct);
  }
  findMyCue(index, cuetype_id) {
    if (!this.props.program) return 0;
    if (!this.props.program[index]) return 0;
    let id = this.props.program[index].song.id;
    return this.props.program.find(
      cue => cue.song.id === id && cue.cuetype_id === cuetype_id
    );
  }
  calculateTotalTime(cues) {
    let starttime, stoptime, skipin, skipout;
    cues.forEach(cue => {
      switch (Number(cue.cuetype_id)) {
        case Vars.CT_START:
          starttime = cue.cuetime;
          break;
        case Vars.CT_STOP:
          stoptime = cue.cuetime;
          break;
        case Vars.CT_SKIP_IN:
          skipin = cue.cuetime;
          break;
        case Vars.CT_SKIP_OUT:
          skipout = cue.cuetime;
          break;
        default:
          break;
      }
    });
    let totaltime = stoptime - starttime;
    if (skipin && skipout) totaltime -= skipout - skipin;
    return totaltime;
  }
  render() {
    return "";
  }
}
