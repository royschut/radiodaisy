import React from "react";

import Vars from "./Vars";
import { RecurringTimer } from "./Tools";

class MixPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mixFlash: false
    };
    this.mixInt = null;
  }
  componentDidUpdate() {
    let p = this.props;
    if (p.mixing !== this.prev_mixing) {
      this.prev_mixing = this.props.mixing;
      if (this.props.mixing) this.doFlash();
      else if (this.mixInt) this.stopFlash();
    }
    if (p.userPause !== this.prev_userPause) {
      this.prev_userPause = this.props.userPause;
      if (this.mixInt && p.userPause) this.pauseFlash();
      else if (this.mixInt && !p.userPause) this.resumeFlash();
    }
  }
  doFlash() {
    this.mixInt = new RecurringTimer(() => {
      this.setState({ mixFlash: !this.state.mixFlash });
    }, 100);
  }
  stopFlash() {
    this.setState({ mixFlash: false });
    if (!this.mixInt) return;
    this.mixInt.clear();
    this.mixInt = null;
  }
  pauseFlash() {
    if (!this.mixInt) return;
    this.mixInt.pause();
  }
  resumeFlash() {
    if (!this.mixInt) return;
    this.mixInt.resume();
  }
  onMixNow() {
    let p = this.props;
    if (!p.mixing && p.songBuffered0 && p.songBuffered1 && p.song0 && p.song1) {
      this.props.mixNow();
    }
  }
  render() {
    let preloader = "";
    switch (this.props.status) {
      case Vars.STATUS_INIT:
      case Vars.STATUS_LOADING:
        preloader = <p>Loading music...</p>;
        break;
      case Vars.STATUS_BUFFERING:
        preloader = <p>Buffering music...</p>;
        break;
      case Vars.STATUS_READY:
        preloader = (
          <div>
            <button
              className="playbutton first"
              onClick={() => this.props.onDoStartProgram()}
            >
              &#9658;
            </button>
            <h3>Hit the decks!</h3>
          </div>
        );
        break;
      default:
        break;
    }
    let beatClass = this.props.beatState ? "mixpanelBeatState" : "";
    return (
      <section className="panel ">
        <div className={"mixpanel " + beatClass}>
          {!this.props.doStartProgram ? (
            <div className="preloader">{preloader}</div>
          ) : (
            <React.Fragment>
              <MixingStatus
                mixing={this.props.mixing}
                beatState={this.props.beatState}
              />
              <MixSide
                firstSongStarted={this.props.firstSongStarted}
                songBuffered={this.props.songBuffered0}
                song={this.props.song0}
                vidActive={this.props.curVidActive === 0}
                userPause={this.props.userPause}
                beatState={this.props.beatState}
                progress={this.props.progress}
                mixFlash={this.state.mixFlash}
                onMixNow={() => this.onMixNow()}
                onUserPause={val => this.props.onUserPause(val)}
                skipToPerc={perc => this.props.skipToPerc(perc)}
              />
              <div className="fader">
                <input
                  type="range"
                  min="1"
                  step="1"
                  max="100"
                  value={this.props.volume}
                  className="slider"
                  orient="vertical"
                  onChange={e => this.props.volumeChange(e.target.value)}
                />
              </div>
              <MixSide
                firstSongStarted={this.props.firstSongStarted}
                songBuffered={this.props.songBuffered1}
                song={this.props.song1}
                vidActive={this.props.curVidActive === 1}
                userPause={this.props.userPause}
                beatState={this.props.beatState}
                progress={this.props.progress}
                mixFlash={this.state.mixFlash}
                onMixNow={() => this.onMixNow()}
                onUserPause={val => this.props.onUserPause(val)}
                skipToPerc={perc => this.props.skipToPerc(perc)}
              />
              <div className="bottombar">
                <div className="playlist">
                  <button className="nexttrack">
                    <img
                      src="./image/playlist_icon.png"
                      className="shuffleimg"
                      alt="Playlist"
                      title="Playlist"
                    />
                  </button>
                  <PlaylistEditor
                    playlist={this.props.playlist}
                    shufflePlaylist={() => this.props.shufflePlaylist()}
                    removeSong={id => this.props.removeSong(id)}
                    moveSongBefore={(fromID, toID) =>
                      this.props.moveSongBefore(fromID, toID)
                    }
                  />
                </div>
                <NextButton
                  mixFlash={this.state.mixFlash}
                  onMixNow={() => this.onMixNow()}
                />
              </div>
            </React.Fragment>
          )}
        </div>
      </section>
    );
  }
}
class MixSide extends React.Component {
  prepareSkipTo(e) {
    if (this.props.vidActive && this.props.firstSongStarted) {
      e.persist();
      let rect = e.target.getBoundingClientRect();
      let x = Math.round(e.clientX - rect.left);
      if (x < 0) x = 0;
      if (x > 150) x = 150;
      x = Math.round(x / 1.5);
      this.props.skipToPerc(x);
    }
  }
  render() {
    let classNames = this.props.vidActive
      ? "mixSide"
      : "mixSide mixSide_inactive inactive";
    let progressClass = "progressdiv";
    progressClass +=
      this.props.vidActive && this.props.firstSongStarted
        ? ""
        : " progressinactive";
    let progresswidth = Number(this.props.progress) * 1.5;
    if (progresswidth > 150) progresswidth = 150; //temp for bugs

    if (!this.props.vidActive) progresswidth = 0;
    return (
      <div className={classNames}>
        {this.props.song && (
          <React.Fragment>
            <div className="artist">
              <p>{this.props.song ? this.props.song.artist : ""}</p>
            </div>
            <div className="tracktitle">
              <p ref={this.titleRef}>
                {this.props.song ? this.props.song.title : ""}
              </p>
            </div>
            <div className="progresscontainer">
              <div
                className={progressClass}
                onClick={e => this.prepareSkipTo(e)}
              >
                <canvas className="progressbar" />
                <canvas
                  className="progress"
                  style={{ width: progresswidth + "px" }}
                />
              </div>
            </div>
            <PlayButton
              active={this.props.vidActive}
              beatState={this.props.beatState}
              mixFlash={this.props.mixFlash}
              songBuffered={this.props.songBuffered}
              userPause={this.props.userPause}
              onUserPause={val => this.props.onUserPause(val)}
              onMixNow={() => this.props.onMixNow()}
            />
          </React.Fragment>
        )}
      </div>
    );
  }
}
class NextButton extends React.Component {
  render() {
    let className = "nexttrack";
    className += this.props.mixFlash ? " nexttrack_flash" : "";
    return (
      <button className={className} onClick={() => this.props.onMixNow()}>
        <img src="./image/playnext_icon.png" alt="Play next" />
      </button>
    );
  }
}
class PlayButton extends React.Component {
  btnClicked() {
    if (this.props.active) this.props.onUserPause(!this.props.userPause);
    else this.props.onMixNow();
  }

  render() {
    let btnClass = "playbutton";
    if (this.props.active) {
      if (this.props.beatState) btnClass += " bpm_onstate_play";
    } else if (!this.props.active) {
      btnClass += " plbtn_inactive";
      if (this.props.mixFlash) btnClass += " bpm_onstate_play";
    }

    let btnstyle = {};
    let loaderstyle = {};
    btnstyle.display = this.props.songBuffered ? "block" : "none";
    loaderstyle.display = !this.props.songBuffered ? "block" : "none";
    let btnTxt = String.fromCharCode(9658);
    if (!this.props.userPause && this.props.active) {
      btnTxt = String.fromCharCode(9614) + String.fromCharCode(9614);
      btnstyle.paddingLeft = 12;
      btnstyle.paddingTop = 0;
      btnstyle.fontSize = 18;
    }
    return (
      <div className="playbuttoncontainer">
        <button
          style={btnstyle}
          className={btnClass}
          onClick={() => this.btnClicked()}
        >
          {btnTxt}
        </button>
        <p style={loaderstyle} className="buffering">
          Buffering..
        </p>
      </div>
    );
  }
}
class MixingStatus extends React.Component {
  constructor(props) {
    super(props);
    this.dotAmount = 6;
  }
  componentDidUpdate() {
    if (this.props.beatState !== this.prev_beatState) {
      this.prev_beatState = this.props.beatState;
      this.dotAmount++;
    }
    if (!this.props.mixing) {
      this.dotAmount = 0;
    }
    if (this.dotAmount > 3) this.dotAmount = 0;
  }
  render() {
    let beatClass = this.props.beatState ? " mixpanelStatusBeatState" : "";
    let dots = ".".repeat(this.dotAmount);
    return (
      <div className={"mixpanelStatus" + beatClass}>
        <div className="mpstatusDiv">
          <span>{this.props.mixing ? "Mixing" + dots : ""}</span>
        </div>
      </div>
    );
  }
}
class PlaylistEditor extends React.Component {
  drag(event) {
    event.dataTransfer.setData("id", event.target.id);
  }
  dragOver(event) {
    event.preventDefault();
    let t = event.target;
    if (t.tagName === "P") t = t.parentElement;
    if (t.tagName === "DIV" && t.dataset.moveallowed === "true") {
      t.style.borderTop = "solid 1px #ffb200";
    }
  }
  dragLeave(event) {
    let t = event.target;
    if (t.tagName === "P") t = t.parentElement;
    if (t.tagName === "DIV") t.style.borderTop = "none";
  }
  drop(event) {
    event.preventDefault();
    let t = event.target;

    if (t.dataset.moveallowed === "true") {
      if (t.tagName === "P") t = t.parentElement;
      if (t.tagName === "DIV") t.style.borderTop = "none";
      let dragID = event.dataTransfer.getData("id");
      let dropID = event.target.id;
      this.props.moveSongBefore(dragID, dropID);
    }
  }
  restrictedDescription(artist, title) {
    let max = 50;
    let str = "";
    if (artist.length + title.length > max) {
      max = max - Math.min(artist.length, title.length) - 3;
    }
    str += artist.length < max - 3 ? artist : artist.substring(0, max) + "...";
    str += " - ";
    str += title.length < max - 3 ? title : title.substring(0, max) + "...";

    return str;
  }
  render() {
    let cuedPL = [];
    let nextPlaylist = this.props.playlist.filter(song => {
      if (song.cued) cuedPL.unshift(song);
      return !song.cued;
    });
    //Add the currently playing two tracks back
    if (cuedPL[0]) nextPlaylist.unshift(cuedPL[0]);
    if (cuedPL[1]) nextPlaylist.unshift(cuedPL[1]);
    return (
      <div className="playlist-content">
        <div className="playlistscroll">
          {nextPlaylist.map((item, index) => (
            <div
              className={index > 1 ? "playlist_item" : "playlist_item playing"}
              key={item.id}
              id={item.id}
              data-moveallowed={index > 1}
              draggable="true"
              style={index > 1 ? { cursor: "pointer" } : {}}
              onDragStart={e => this.drag(e)}
              onDrop={e => this.drop(e)}
              onDragOver={e => this.dragOver(e)}
              onDragLeave={e => this.dragLeave(e)}
            >
              <p
                id={item.id}
                style={{ cursor: "inherit" }}
                data-moveallowed={index > 1}
              >
                {this.restrictedDescription(item.artist, item.title)}
                {index < 2 && " [CUED]"}
              </p>
              {index > 1 && (
                <button
                  className="playlist_remove"
                  onClick={() => this.props.removeSong(item.id)}
                >
                  x
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="playlist_shuffle">
          <p>{nextPlaylist.length} songs in playlist</p>
          <img
            src="./image/shuffle.png"
            className="shuffleimg"
            alt="Shuffle playlist"
            title="Shuffle playlist"
            onClick={() => this.props.shufflePlaylist()}
          />
        </div>
      </div>
    );
  }
}
export default MixPanel;
