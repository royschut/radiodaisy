import React from "react";
import { isMobile } from "react-device-detect";

import Vars from "./Vars";
import MusicProgrammer from "./MusicProgrammer";
import MusicYoutubePlayer from "./MusicYoutubePlayer";

/**
 *
 * Music Player
 *
 * Takes a playlist.
 * Lets the Programmer create a nice program
 * Lets the ProgramController run this program
 * Recieves events from PC
 * Runs and controls 2 YouTube players around these events
 *
 */
const initState = {
  ytid0: 0,
  ytid1: 0,
  bufferCue0: 0,
  bufferCue1: 0,
  fadeOut0: null,
  fadeOut1: null,
  fadeIn0: null,
  fadeIn1: null,
  doPlay0: false,
  doPlay1: false,
  visible0: false,
  visible1: false,
  skipTo0: null,
  skipTo1: null,

  waitingForRebuffer: null //for delaying MPC when skipping through song
};
export default class MusicPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.state = initState;
    this.prev_playlist = [];
    this.initPlaylistState(true);
  }
  initPlaylistState(firstRun = false) {
    this.songIndex = 0;
    this.curVidActive = null;

    if (!firstRun) this.setState(initState);
  }
  componentDidUpdate() {
    let p = this.props;
    if (p.status !== this.prev_status) {
      this.prev_status = p.status;
      if (p.status === Vars.STATUS_LOADING) this.initPlaylistState();
      if (p.status === Vars.STATUS_BUFFERING) this.newPlaylist();
    }
    if (p.tryFullScreen !== this.prev_tryFullScreen) {
      this.prev_tryFullScreen = p.tryFullScreen;
      if (p.tryFullScreen) this.tryFullscreen();
    }
  }
  newPlaylist() {
    this.bufferNext(0);
    this.bufferNext(1);
  }
  bufferNext(player) {
    let song = this.props.playlist[this.songIndex];
    if (song) {
      let stateobj = {};
      stateobj["ytid" + player] = song.ytid;
      stateobj["bufferCue" + player] = song.cues[0].cuetime;
      this.setState(stateobj);
      this.songIndex++;

      //tell parent about buffering song
      this.props.songBuffering(song, player);
    } else {
      this.props.songBuffering(null, player);
    }
  }

  onProgramAction(cue, timeToNext) {
    let action = Number(cue.cuetype_id);
    let stateobj = {};
    let player = cue.songIndex % 2;
    let otherPlayer = player ? 0 : 1;

    switch (action) {
      case Vars.CT_PRE_OVER:
        stateobj["doPlay" + player] = true;
        if (!this.props.firstSongStarted) {
          stateobj["visible" + player] = true;
        } else {
          if (timeToNext > 1) stateobj["fadeOut" + otherPlayer] = timeToNext;
          if (timeToNext > 3) stateobj["fadeIn" + player] = timeToNext;
          this.props.isMixing(true);
        }
        if (isMobile) {
          //Mobile can't overlap 2 vids, so simply switch
          stateobj["visible" + player] = true;
          stateobj["visible" + otherPlayer] = false;
          stateobj["doPlay" + otherPlayer] = false;
        }
        break;
      case Vars.CT_START:
        stateobj["doPlay" + player] = true;
        stateobj["visible" + player] = true;
        this.curVidActive = player;
        this.props.curVidActive(player);
        break;
      case Vars.CT_FADE_IN:
        break;
      case Vars.CT_FADE_OUT:
        break;
      case Vars.CT_SKIP_IN:
        stateobj["skipTo" + player] = cue.cuetime + timeToNext;
        break;
      case Vars.CT_SKIP_OUT:
        //Do nothing. The onSkipDone already resets the skipTo (when buffered)
        break;
      case Vars.CT_STOP:
        stateobj["doPlay" + player] = false;
        stateobj["visible" + player] = false;
        stateobj["fadeOut" + player] = null;
        if (this.curVidActive === player) this.curVidActive = null;
        this.bufferNext(player);
        this.props.isMixing(false);
        break;
      default:
        break;
    }
    this.setState(stateobj);
  }
  //This order comes from the MPC
  onSkipTo(time) {
    this.setState({ ["skipTo" + this.curVidActive]: time });
  }
  onSkipDone(player) {
    this.setState({ ["skipTo" + player]: null });
    this.props.onSkipDone();
  }
  tryFullscreen() {
    this.setState({ ["fullScreen" + this.curVidActive]: true });
    this.props.fullScreenTried();
  }
  fullScreenSet() {
    this.setState({ fullScreen1: false, fullScreen0: false });
  }
  render() {
    let classInvisible = isMobile ? "" : "invisible";
    let beatClass = this.props.beatState ? "ytBeatstate" : "";
    let ytWidth = isMobile ? 160 : 350;
    return (
      <div>
        <MusicProgrammer
          playlist={this.props.playlist}
          doStart={this.props.doStartProgram}
          userPause={this.props.userPause}
          mixNow={this.props.mixNow}
          skipToPerc={this.props.skipToPerc}
          onProgramAction={(cue, timeToNext) =>
            this.onProgramAction(cue, timeToNext)
          }
          onHalfBeat={progress => this.props.onHalfBeat(progress)}
          onResetBeat={() => this.props.onResetBeat()}
          onMixNow={() => this.props.onMixNow()}
          onSkipTo={time => this.onSkipTo(time)}
          onPlaylistFinished={() => this.props.onPlaylistFinished()}
        />
        <div className={"ytplayers " + beatClass}>
          {this.props.doStartProgram && !isMobile && (
            <img
              className="ytfullscreen"
              src="./image/fullscreen_icon.png"
              alt="Full screen"
              title="Full screen"
              onClick={() => this.tryFullscreen()}
            />
          )}

          <div className={this.state.visible0 ? "" : classInvisible}>
            <MusicYoutubePlayer
              playerNr="0"
              width={ytWidth}
              ytid={this.state.ytid0}
              starttime={this.state.bufferCue0}
              doPlay={this.state.doPlay0}
              skipTo={this.state.skipTo0}
              fadeIn={this.state.fadeIn0}
              fadeOut={this.state.fadeOut0}
              fullScreen={this.state.fullScreen0}
              userPause={this.props.userPause}
              volume={this.props.volume}
              onSkipDone={() => this.onSkipDone(0)}
              onVideoBuffered={() => this.props.onVideoBuffered(0)}
              onUserPause={val => this.props.onUserPause(val)}
              fullScreenSet={() => this.fullScreenSet()}
            />
          </div>
          <div className={this.state.visible1 ? "" : classInvisible}>
            <MusicYoutubePlayer
              playerNr="1"
              width={ytWidth}
              ytid={this.state.ytid1}
              starttime={this.state.bufferCue1}
              doPlay={this.state.doPlay1}
              skipTo={this.state.skipTo1}
              fadeIn={this.state.fadeIn1}
              fadeOut={this.state.fadeOut1}
              fullScreen={this.state.fullScreen1}
              userPause={this.props.userPause}
              volume={this.props.volume}
              onSkipDone={() => this.onSkipDone(1)}
              onVideoBuffered={() => this.props.onVideoBuffered(1)}
              onUserPause={val => this.props.onUserPause(val)}
              fullScreenSet={() => this.fullScreenSet()}
            />
          </div>
        </div>
      </div>
    );
  }
}
