import React from "react";
import YouTube from "react-youtube";

import DataDelegate from "./DataDelegate";
import Vars from "./Vars";
import { RecurringTimer } from "./Tools";

class Backend extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      song: new Song(),
      musicStyles: [],
      musicStyle_id: 0,
      doLoad_musicStyles: false,
      doUploadSong: false,
      uploadingSong: false,
      doReloadPlaylist: false,

      vidTitle: false,
      countFrom: null,
      countTo: null,

      bgrImages: [],

      showImages: false
    };
    this.CUETYPES = {
      1: "START",
      2: "STOP",
      3: "PRESTART_OVERLAP",
      4: "FADE_IN",
      5: "FADE_OUT",
      6: "SKIP_IN",
      7: "SKIP_OUT"
    };
    this.ytplayer = null;
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.changeCuetype = this.changeCuetype.bind(this);
    this.changeCueMixtype = this.changeCueMixtype.bind(this);
  }
  componentDidMount() {
    this.setState({ doLoad_musicStyles: true });
  }
  onMusicStylesLoaded(event) {
    let styles = [];
    let imgs = [];
    let id = null;
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
  }
  setMusicStyle(style_id) {
    this.setState({ musicStyle_id: style_id }, () => {
      this.newSong();
    });
  }
  newSong() {
    let song = new Song();
    song.musicstyle_id = this.state.musicStyle_id;
    this.setState({
      song: song,
      vidTitle: null,
      countFrom: null,
      countTo: null
    });
  }
  loadSong(song) {
    this.setState({ song: song, vidTitle: null });
  }
  handleChange(event) {
    let obj = this.state.song;
    obj[event.target.name] = event.target.value;
    this.setState({ song: obj });
    if (event.target.name === "ytid") {
      this.setState({ vidTitle: "" });
    }
  }
  handleSubmit(event) {
    event.preventDefault();
    //todo: set all inactive until result
    this.setState({ doUploadSong: true });
  }
  onSongUploaded(result) {
    let song = this.state.song;
    song.id = result.id;
    this.setState({
      doUploadSong: false,
      song: new Song(),
      doReloadPlaylist: true,
      vidTitle: null
    });
  }
  vidReady(event) {
    this.ytplayer = event.target;
  }
  addCue(cuetype_id) {
    let cuetime = Math.round(this.ytplayer.getCurrentTime() * 10000) / 10000;
    let cue = {
      cuetime: cuetime,
      cuetype_id: cuetype_id,
      mixtype_id: Vars.MIXTYPE_DEFAULT
    };
    let cues = this.state.song.cues;
    cues.push(cue);
    let song = this.state.song;
    song.cues = cues;
    this.setState({ song: song });
  }
  updateCue(newCue, index) {
    let song = this.state.song;
    song.cues[index].cuetime = parseFloat(newCue);
    this.setState({ song: song });
  }
  gotoCue(index) {
    let cue = this.state.song.cues[index];
    this.ytplayer.seekTo(cue.cuetime);
  }
  gotoBpmCue(cue) {
    this.ytplayer.seekTo(cue);
  }
  removeCue(index) {
    let cues = this.state.song.cues;
    cues.splice(index, 1);
    let song = this.state.song;
    song.cues = cues;
    this.setState({ song: song });
  }
  changeCuetype(index, cuetype_id) {
    let cues = this.state.song.cues;
    cues[index].cuetype_id = cuetype_id;
    let song = this.state.song;
    song.cues = cues;
    this.setState({ song: song });
  }
  changeCueMixtype(index, mixtype_id) {
    let cues = this.state.song.cues;
    cues[index].mixtype_id = mixtype_id;
    let song = this.state.song;
    song.cues = cues;
    this.setState({ song: song });
  }
  cueRound(cuetime) {
    return Math.round(Number(cuetime) * 100) / 100;
  }
  getCueTime(cues, cuetype_id) {
    let ct = cues[cues.findIndex(cue => cue.cuetype_id === cuetype_id)].cuetime;
    return this.cueRound(ct);
  }
  changeCalc(event) {
    let obj = {};
    let val = Math.round(event.target.value * 1000) / 1000;
    obj[event.target.name] = val;
    this.setState(obj, () => {
      this.calcBpmFromCues();
    });
  }
  setCountFrom() {
    let curTime = Math.round(this.ytplayer.getCurrentTime() * 1000) / 1000;
    this.setState({ countFrom: curTime, countTo: null });
  }
  setCountTo() {
    let curTime = Math.round(this.ytplayer.getCurrentTime() * 1000) / 1000;
    this.setState({ countTo: curTime }, () => {
      this.calcBpmFromCues();
    });
  }
  calcBpmFromCues() {
    let min = Vars.BPM_RANGE_MIN;
    if (this.state.countFrom && this.state.countTo) {
      let song = this.state.song;
      let time = this.state.countTo - this.state.countFrom;
      let bpm = 60 / time;
      while (bpm < min) {
        bpm *= 2;
      }
      song.bpm = Math.round(bpm);
      this.setState({
        song: song
      });
    }
  }
  doubleBPM() {
    let song = this.state.song;
    song.bpm *= 2;
    this.setState({ song: song });
  }
  halfBPM() {
    let song = this.state.song;
    song.bpm /= 2;
    this.setState({ song: song });
  }
  dec(val) {
    //makes a 2 decimal, even if 0
    let str = String(val);
    if (val % 1 === 0) str += ".00";
    else if ((val * 10) % 1 === 0) str += "0";
    return str;
  }
  getMusicTitle() {
    let orgTitle = this.ytplayer.getVideoData().title;
    let calcArtist = orgTitle.slice(0, orgTitle.indexOf("-") - 1);
    let calcTitle = orgTitle.slice(
      orgTitle.indexOf("-") + 1,
      orgTitle.indexOf("(") > 0 ? orgTitle.indexOf("(") - 1 : undefined
    );
    //todo: make update song function
    let song = this.state.song;
    song.artist = calcArtist;
    song.title = calcTitle;
    this.setState({
      vidTitle: orgTitle,
      song: song
    });
  }
  playerStateChange(ytEvent) {
    if (ytEvent === Vars.YT_PLAYING && !this.state.song.title) {
      //only first time
      this.getMusicTitle();
    }
  }
  render() {
    const opts = {
      height: 300,
      width: 1000,
      playerVars: {
        enablejsapi: 1
      }
    };

    return (
      <div className="backend">
        <div className="be_dblrow">
          <YouTube
            videoId={this.state.song.ytid}
            opts={opts}
            onReady={event => this.vidReady(event)}
            onStateChange={event => this.playerStateChange(event.data)}
          />
        </div>
        <DataDelegate
          action={DataDelegate.ACT_GETMUSICSTYLES}
          doLoad={this.state.doLoad_musicStyles}
          callBack={event => this.onMusicStylesLoaded(event)}
        />
        <BEPlaylists
          bgrImages={this.state.bgrImages}
          onDoLoadSong={song => this.loadSong(song)}
          musicStyles={this.state.musicStyles}
          setMusicStyle={style_id => this.setMusicStyle(style_id)}
          doReloadPlaylist={this.state.doReloadPlaylist}
          playlistLoaded={() => this.setState({ doReloadPlaylist: false })}
        />
        <div className="be_fullPanel">
          <DataDelegate
            action={
              this.state.song.id
                ? DataDelegate.ACT_UPDATESONG
                : DataDelegate.ACT_INSERTSONG
            }
            data={this.state.song}
            doLoad={this.state.doUploadSong}
            callBack={event => this.onSongUploaded(event)}
          />
          <div>
            <button
              onClick={() =>
                this.setState({ showImages: !this.state.showImages })
              }
            >
              Toggle image panel
            </button>
            <BpmFlasher bpm={this.state.song.bpm} />
          </div>
          {this.state.showImages && (
            <BEImages
              bgrImages={this.state.bgrImages[this.state.musicStyle_id]}
            />
          )}
          {!this.state.showImages && (
            <form onSubmit={this.handleSubmit}>
              <div className="be_songpanel">
                <p>{this.state.vidTitle && "Recieved Vid title:"}</p>
                <p>{this.state.vidTitle}</p>
                <p>id</p>
                <p>{this.state.song.id}</p>
                <p>ytid</p>
                <input
                  name="ytid"
                  type="text"
                  value={this.state.song.ytid ? this.state.song.ytid : ""}
                  onChange={this.handleChange}
                />
                <input
                  name="artist"
                  type="text"
                  value={this.state.song.artist ? this.state.song.artist : ""}
                  onChange={this.handleChange}
                />
                <input
                  name="title"
                  type="text"
                  value={this.state.song.title ? this.state.song.title : ""}
                  onChange={this.handleChange}
                />
                <p>Cues</p>
                <div className="be_cues">
                  <div className="be_cuelist">
                    {this.state.song.cues.map((item, key) => (
                      <React.Fragment key={item.cuetime}>
                        <input
                          name="cue"
                          onChange={event =>
                            this.updateCue(event.target.value, key)
                          }
                          value={this.dec(item.cuetime)}
                        />
                        <select
                          name="mixtype_id"
                          value={item.mixtype_id}
                          onChange={event =>
                            this.changeCueMixtype(key, event.target.value)
                          }
                        >
                          {Vars.MIXTYPES.map((mixtypeId, index) => (
                            <option value={mixtypeId} key={mixtypeId}>
                              {Vars.MIXTYPES_STRINGS[index]}
                            </option>
                          ))}
                        </select>
                        <select
                          name="cuetype_id"
                          value={item.cuetype_id}
                          onChange={event =>
                            this.changeCuetype(key, event.target.value)
                          }
                        >
                          {Vars.CUETYPES.map(cueObj => (
                            <option value={cueObj.id} key={cueObj.id}>
                              {cueObj.type}
                            </option>
                          ))}
                        </select>
                        <button type="button" onClick={() => this.gotoCue(key)}>
                          &#9658;
                        </button>
                        <button
                          type="button"
                          onClick={() => this.removeCue(key)}
                        >
                          x
                        </button>
                        <br />
                      </React.Fragment>
                    ))}
                  </div>
                  <div className="be_dblrow">
                    {Vars.CUETYPES.map(cueObj => (
                      <button
                        type="button"
                        key={cueObj.id}
                        onClick={() => this.addCue(cueObj.id)}
                      >
                        {cueObj.type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bpmtester be_dblrow">
                  <p className="be_margin">Bpm:</p>
                  <input
                    className="be_bpmlabels"
                    name="bpm"
                    type="text"
                    value={this.state.song.bpm}
                    onChange={this.handleChange}
                  />
                  <button
                    className="be_margin"
                    type="button"
                    onClick={() => this.doubleBPM()}
                  >
                    *2
                  </button>
                  <button
                    className="be_margin"
                    type="button"
                    onClick={() => this.halfBPM()}
                  >
                    /2
                  </button>
                  <p>FROM CUES:</p>
                  <input
                    className="be_bpmlabels"
                    name="countFrom"
                    type="text"
                    value={
                      this.state.countFrom ? this.dec(this.state.countFrom) : ""
                    }
                    onChange={e => this.changeCalc(e)}
                  />
                  <button
                    name="bpm"
                    className="be_margin"
                    type="button"
                    onClick={() => this.setCountFrom()}
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={() => this.gotoBpmCue(this.state.countFrom)}
                  >
                    &#9658;
                  </button>
                  <input
                    className="be_bpmlabels"
                    name="countTo"
                    type="text"
                    value={
                      this.state.countTo ? this.dec(this.state.countTo) : ""
                    }
                    onChange={e => this.changeCalc(e)}
                  />
                  <button
                    name="bpm"
                    className="be_margin"
                    type="button"
                    onClick={() => this.setCountTo()}
                  >
                    C
                  </button>
                  <button
                    type="button"
                    onClick={() => this.gotoBpmCue(this.state.countTo)}
                  >
                    &#9658;
                  </button>
                </div>
                <div className="be_dblrow be_bottombar">
                  <input
                    className="be_margin"
                    type="submit"
                    value={this.state.song.id ? "UPDATE" : "INSERT"}
                  />
                  <input
                    className="be_margin"
                    type="button"
                    value="CLEAR X"
                    onClick={() => this.newSong()}
                  />
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }
}
class BpmFlasher extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      flash: false
    };
  }
  componentDidUpdate() {
    if (this.props.bpm !== this.prev_bpm) {
      this.prev_bpm = this.props.bpm;
      if (this.props.bpm) this.resetInt();
    }
  }
  resetInt() {
    console.log(";create");
    if (this.bpmInterval) {
      this.bpmInterval.clear();
    }
    let bpm = this.props.bpm;
    let beatStep = bpm / 60;
    this.bpmInterval = new RecurringTimer(() => {
      console.log("int");
      this.setState({ flash: !this.state.flash });
    }, (beatStep / 2) * 1000);
  }
  render() {
    let btnClass = "be_bpmbutton ";
    btnClass += this.state.flash ? " be_bpmbutton_flash" : "";
    return <button className={btnClass}>{"BPM:" + this.props.bpm} </button>;
  }
}
class BEPlaylists extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      playlist: [],
      musicstyle_id: null,
      doGetPlaylist: false,
      gettingPlaylist: false
    };
  }
  componentDidUpdate() {
    if (this.props.doReloadPlaylist && !this.state.doGetPlaylist) {
      this.setState({ doGetPlaylist: true });
    }
  }
  componentDidMount() {
    this.setMusicStyle(Vars.MUSICSTYLE_DEFAULT);
  }
  handleChange(event) {
    this.setMusicStyle(event.target.value);
  }
  setMusicStyle(style_id) {
    this.setState({ musicstyle_id: style_id });
    this.props.setMusicStyle(style_id);
    this.setState({ doGetPlaylist: true });
  }
  onPlaylistLoaded(result) {
    let pl = result.data;
    pl.sort((a, b) => a.artist.localeCompare(b.artist));
    this.setState({
      doGetPlaylist: false,
      playlist: pl
    });
    this.props.playlistLoaded();
  }
  loadSong(songIndex) {
    this.props.onDoLoadSong(this.state.playlist[songIndex]);
  }
  render() {
    return (
      <div>
        <DataDelegate
          action={DataDelegate.ACT_GETPLAYLISTBYSTYLE}
          data={this.state.musicstyle_id}
          doLoad={this.state.doGetPlaylist}
          callBack={event => this.onPlaylistLoaded(event)}
        />
        Playlist:
        <select
          name="musicstyle_id"
          value={this.state.musicstyle_id ? this.state.musicstyle_id : ""}
          onChange={event => this.handleChange(event)}
        >
          {this.props.musicStyles.map(style => (
            <option value={style.id} key={style.id}>
              {style.style}
            </option>
          ))}
        </select>
        <div className="be_playlist">
          {this.state.playlist.map((item, index) => (
            <p
              key={item.id}
              className="be_playlistittem"
              onClick={() => this.loadSong(index)}
            >
              {item.artist + " - " + item.title}
            </p>
          ))}
        </div>
      </div>
    );
  }
}
class BEImages extends React.Component {
  add() {}
  render() {
    return (
      <div className="be_imgpanel">
        <p>Images:</p>
        <div>
          <button onClick={() => this.add()}>Add</button>
          <input></input>
        </div>
        {!this.props.bgrImages
          ? ""
          : this.props.bgrImages.map(img => (
              <div key={img}>
                {img}
                <img src={"./image/bgr/bgr" + img + ".jpg"} alt={img} />
              </div>
            ))}
      </div>
    );
  }
}
class Song extends Object {
  constructor(
    ytid = null,
    artist = null,
    title = null,
    bpm = 0,
    musicstyle_id = Vars.MUSICSTYLE_DEFAULT
  ) {
    super();
    this.id = null;
    this.ytid = ytid;
    this.artist = artist;
    this.title = title;
    this.bpm = bpm;
    this.musicstyle_id = musicstyle_id;
    this.cues = [];
  }
}
export default Backend;
