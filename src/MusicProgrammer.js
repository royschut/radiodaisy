import React from "react";

import Vars from "./Vars";
import MusicProgramController from "./MusicProgramController";

/**
 *
 * Music Programmer
 *
 * Reads this.props.programList
 * Makes a nice sorted timeline array of all cues: program
 * Lets the ProgramController handle this program
 *
 */

export default class MusicProgrammer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { program: [] };
    this.prev_playlist = [];
  }
  componentDidUpdate() {
    let pl = this.props.playlist;
    if (pl.length && pl.join("") !== this.prev_playlist.join("")) {
      this.prev_playlist = pl;
      let program = this.calculateProgram(this.props.playlist);
      this.setState({ program: program });
    }
  }
  calculateProgram(playlist) {
    let curTime = 0;
    let program = playlist.flatMap((song, songIndex) => {
      let startCue = this.getCueTime(song.cues, Vars.CT_START);
      let stopCue = this.getCueTime(song.cues, Vars.CT_STOP);
      let sublist = song.cues.map(curCue => {
        let c = { ...curCue };
        c.absoluteCuetime = this.cueRound(curTime + (c.cuetime - startCue));
        c.cuetype_id = Number(c.cuetype_id);
        c.song = song;
        c.songIndex = songIndex;
        c.cuetime = this.cueRound(c.cuetime);
        return c;
      });
      curTime += stopCue - startCue;
      return sublist;
    });
    program.sort((a, b) => a.absoluteCuetime - b.absoluteCuetime);

    return program;
  }
  cueRound(cuetime) {
    return Math.round(Number(cuetime) * 100) / 100;
  }
  getCueTime(cues, cuetype_id) {
    let ct =
      cues[cues.findIndex(cue => Number(cue.cuetype_id) === cuetype_id)]
        .cuetime;
    return this.cueRound(ct);
  }
  render() {
    return (
      <MusicProgramController
        program={this.state.program}
        doStart={this.props.doStart}
        userPause={this.props.userPause}
        mixNow={this.props.mixNow}
        skipToPerc={this.props.skipToPerc}
        onProgramAction={(action, timeToNext) =>
          this.props.onProgramAction(action, timeToNext)
        }
        onHalfBeat={progress => this.props.onHalfBeat(progress)}
        onResetBeat={() => this.props.onResetBeat()}
        onMixNow={() => this.props.onMixNow()}
        onSkipTo={time => this.props.onSkipTo(time)}
        onPlaylistFinished={() => this.props.onPlaylistFinished()}
      />
    );
  }
}
