import React from "react";

import MusicPlayer from "./MusicPlayer";
import MusicStyleMenu from "./MusicStyleMenu";
import MixPanel from "./MixPanel";
import DataDelegate from "./DataDelegate";
import DaisyInfo from "./DaisyInfo";
import { shuffleArray } from "./Tools";
import RotatingBgr from "./RotatingBgr";
import Vars from "./Vars";

const initState = {
  playlist: [],

  doStartProgram: false,
  curVidActive: 0,
  tryFullScreen: false,
  firstSongStarted: false, //to disable elements when first is in PRESTART

  song0: null,
  song1: null,
  progress: 0,
  songBuffered0: false,
  songBuffered1: false,

  mixing: null,
  userPause: null,
  mixNow: null,
  skipToPerc: null,

  beatState: false //switches TRUE on each beat
};

export default class RadioDaisy extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      status: Vars.STATUS_INIT,

      urlstring: this.props.match.params.id,

      musicStyles: [],
      playlist: [],
      bgrImages: [],
      musicStyle_id: null,

      doLoad_playlist: false,
      doLoad_musicStyles: false,

      volume: 100
    };
    this.state = { ...this.state, initState };
  }
  componentDidMount() {
    this.setState({ doLoad_musicStyles: true, status: Vars.STATUS_LOADING });
    document.addEventListener("keydown", event => this.onKeydown(event));
  }
  onKeydown(event) {
    let volume;
    switch (event.keyCode) {
      case 32: //Space/Enter - Pause/unpause
      case 13:
        if (this.state.doStartProgram) {
          this.setState({ userPause: !this.state.userPause });
        } else this.setState({ doStartProgram: true });
        break;
      case 39: //Right - Mix
        if (
          this.state.songBuffered0 &&
          this.state.songBuffered1 &&
          this.state.doStartProgram &&
          this.state.firstSongStarted
        )
          this.tryMixNow();
        break;
      case 40: //Down - Volume down
        volume = Number(this.state.volume);
        volume -= volume > 10 ? 10 : volume;
        if (this.state.doStartProgram) this.setState({ volume: volume });
        break;
      case 38: //Up - Volume up
        volume = Number(this.state.volume);
        volume = volume < 90 ? volume + 10 : 100;
        if (this.state.doStartProgram) this.setState({ volume: volume });
        break;
      case 70: //F - fullscreen
        if (this.state.doStartProgram) this.setState({ tryFullScreen: true });
        break;
      default:
        break;
    }
  }
  onMusicStylesLoaded(event) {
    //Load images and musicStyleMenu
    let styles = [],
      imgs = [],
      id = null;
    event.data.forEach(cur => {
      if (cur.id !== id) {
        id = cur.id;
        styles.push(cur);
        imgs[id] = [];
      }
      imgs[id].push(cur.jpg_nr);
    });
    this.setState({
      musicStyles: styles,
      bgrImages: imgs,
      doLoad_musicStyles: false
    });

    //Load a playlist
    if (!this.state.musicStyle_id) {
      if (this.state.urlstring) {
        id = styles.filter(style => style.urlstring === this.state.urlstring);
        if (id) id = id[0].id;
      }
      if (id) this.loadPlaylist(id);
      else this.loadRandomPlaylist();
    }
  }
  loadRandomPlaylist() {
    if (!this.state.doLoad_playlist) {
      let randomStyleId = shuffleArray(this.state.musicStyles.slice())[0].id;
      if (Number(randomStyleId) === this.state.musicStyle_id)
        this.loadRandomPlaylist();
      else this.loadPlaylist(Number(randomStyleId));
    }
  }
  loadPlaylist(styleId) {
    let urlstring = this.state.musicStyles.find(
      item => Number(item.id) === Number(styleId)
    ).urlstring;
    if (urlstring !== this.state.urlstring) {
      this.props.history.push(urlstring);
    }
    let stateobj = {
      status: Vars.STATUS_LOADING,
      urlstring: urlstring,
      musicStyle_id: styleId,
      doLoad_playlist: true
    };
    this.setState({ ...initState, ...stateobj });
  }
  onPlaylistLoaded(event) {
    this.setState({
      playlist: event.data,
      doLoad_playlist: false,
      status: Vars.STATUS_BUFFERING
    });
  }
  tryMixNow() {
    this.setState({ mixNow: true, mixing: true, userPause: null });
  }
  removeSong(id) {
    let pl = this.state.playlist;
    pl = pl.filter(item => {
      return item.id !== id;
    });
    this.setState({ playlist: pl });
  }
  moveSongBefore(fromID, toID) {
    if (!fromID || !toID) return;
    let pl = this.state.playlist.slice();
    let fromIndex, toIndex;
    pl.forEach((item, index) => {
      if (item.id === fromID) fromIndex = index;
      if (item.id === toID) toIndex = index;
    });
    let cutitem = pl.splice(fromIndex, 1)[0];
    pl.splice(toIndex, 0, cutitem);
    this.setState({ playlist: pl });
  }
  onHalfBeat(progress) {
    this.setState({
      progress: progress,
      beatState: !this.state.beatState,
      firstSongStarted: true
    });
  }
  onResetBeat() {
    this.setState({ beatState: false });
  }
  onSongBuffering(song, player) {
    let stateobj = {};
    stateobj["song" + player] = song;
    if (song) {
      stateobj["songBuffered" + player] = false;

      //Set 'cued', so playlist panel won't show it
      let songId = song.id;
      let pl = this.state.playlist;
      pl = pl.map(song => {
        if (song.id === songId) song.cued = true;
        return song;
      });
      stateobj.playlist = pl;
    }
    this.setState(stateobj);
  }
  onVideoBuffered(player) {
    let stateobj = {};
    stateobj["songBuffered" + player] = true;
    //if (player === 0)
    stateobj.status = Vars.STATUS_READY;
    this.setState(stateobj);
  }
  shufflePlaylist() {
    let pl = this.state.playlist;
    let cued = [];
    let rest = [];
    pl.forEach(song => {
      if (song.cued) cued.push(song);
      else rest.push(song);
    });
    let newpl = cued.concat(shuffleArray(rest));
    this.setState({ playlist: newpl });
  }
  render() {
    return (
      <div className="App">
        <RotatingBgr
          onKeyPress={event => this.onKeydown(event)}
          images={this.state.bgrImages[this.state.musicStyle_id]}
        />
        <header className="header">
          <div
            className="header_title"
            onClick={() => this.loadRandomPlaylist()}
          >
            <div className="logo">
              <img src="./image/daisy.png" alt="Logo Daisy" />
            </div>
            <h1>Radio Daisy</h1>
            <div className="header_tooltip">Load random playlist</div>
          </div>
          <div className="header_right">
            <ul>
              <MusicStyleMenu
                musicStyle_id={this.state.musicStyle_id}
                musicStyles={this.state.musicStyles}
                setMusicStyle={id => this.loadPlaylist(id)}
              />
              <div className="divider">
                <div></div>
              </div>
              <div className="about">
                <li>
                  <button>About</button>
                </li>
                <DaisyInfo />
              </div>
            </ul>
          </div>
          <DataDelegate
            action={DataDelegate.ACT_GETMUSICSTYLES}
            doLoad={this.state.doLoad_musicStyles}
            callBack={event => this.onMusicStylesLoaded(event)}
          />
        </header>
        <section className="main">
          <DataDelegate
            action={DataDelegate.ACT_GETPLAYLISTBYSTYLE}
            data={this.state.musicStyle_id}
            doLoad={this.state.doLoad_playlist}
            callBack={event => this.onPlaylistLoaded(event)}
          />
          <MusicPlayer
            status={this.state.status}
            beatState={this.state.beatState}
            playlist={this.state.playlist}
            musicStyle_id={this.state.musicStyle_id}
            volume={this.state.volume}
            doStartProgram={this.state.doStartProgram}
            tryFullScreen={this.state.tryFullScreen}
            firstSongStarted={this.state.firstSongStarted}
            mixNow={this.state.mixNow}
            userPause={this.state.userPause}
            skipToPerc={this.state.skipToPerc}
            onUserPause={val => this.setState({ userPause: val })}
            onVideoBuffered={player => this.onVideoBuffered(player)}
            onHalfBeat={progress => this.onHalfBeat(progress)}
            onResetBeat={() => this.onResetBeat()}
            onSkipDone={() =>
              this.setState({ skipToPerc: null, userPause: false })
            }
            songBuffering={(song, player) => this.onSongBuffering(song, player)}
            curVidActive={player => this.setState({ curVidActive: player })}
            isMixing={val => this.setState({ mixing: val })}
            onMixNow={() => {
              this.setState({ mixNow: false });
            }}
            fullScreenTried={() => this.setState({ tryFullScreen: false })}
            onPlaylistFinished={() => this.loadRandomPlaylist()}
          />
        </section>
        <MixPanel
          status={this.state.status}
          mixing={this.state.mixing}
          beatState={this.state.beatState}
          doStartProgram={this.state.doStartProgram}
          playlist={this.state.playlist}
          songBuffered0={this.state.songBuffered0}
          songBuffered1={this.state.songBuffered1}
          firstSongStarted={this.state.firstSongStarted}
          song0={this.state.song0}
          song1={this.state.song1}
          curVidActive={this.state.curVidActive}
          userPause={this.state.userPause}
          progress={this.state.progress}
          volume={this.state.volume}
          onDoStartProgram={() => this.setState({ doStartProgram: true })}
          onUserPause={val => this.setState({ userPause: val })}
          volumeChange={val => this.setState({ volume: val })}
          shufflePlaylist={() => this.shufflePlaylist()}
          mixNow={() => this.tryMixNow()}
          skipToPerc={perc => this.setState({ skipToPerc: perc })}
          removeSong={id => this.removeSong(id)}
          moveSongBefore={(fromID, toID) => this.moveSongBefore(fromID, toID)}
        />
        <footer>
          <div className="pexelsnotation bpm_normalstate">
            Photos provided by <a href="http://www.pexels.com">Pexels.com</a>
          </div>
        </footer>
      </div>
    );
  }
}
