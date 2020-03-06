import React from "react";
import YouTube from "react-youtube";

import Vars from "./Vars";
import { isMobile } from "react-device-detect";

class MusicYoutubePlayer extends React.Component {
  constructor(props) {
    super(props);

    this.isPlaying = false;
    this.buffered = null; //false for buffering, true for buffered;
    this.ytplayer = null;
    this.skipping = false;
    this.userPaused = false;

    this.prev_ytid = null;
    this.prev_volume = 0;
    this.prev_fadeOut = null;
    this.prev_fadeIn = null;
  }
  componentDidUpdate() {
    let p = this.props; //shorter, better overview

    let newVid = p.ytid && p.ytid !== this.prev_ytid;
    let mustPlay = !this.isPlaying && p.doPlay && !p.userPause && this.ytplayer;
    let mustPause = this.isPlaying && (p.userPause || !p.doPlay);
    let mustSkip = p.skipTo && !this.skipping;
    let volumeChange = p.volume !== this.prev_volume;
    let fullScreen = p.fullScreen;
    let mustFadeOut = p.fadeOut !== this.prev_fadeOut;
    let mustFadeIn = p.fadeIn !== this.prev_fadeIn;

    if (newVid) {
      this.buffered = null;
      this.prev_ytid = this.props.ytid;
    }
    if (mustPlay) {
      this.isPlaying = true;
      this.ytplayer.playVideo();
    } else if (mustPause) {
      this.isPlaying = false;
      if (!p.doPlay) this.buffered = null;
      this.ytplayer.pauseVideo();
    }
    if (mustSkip) {
      this.ytplayer.seekTo(Math.round(this.props.skipTo));
      this.ytplayer.playVideo();
      this.skipping = true;
    }
    if (volumeChange) {
      this.prev_volume = this.props.volume;
      if (this.ytplayer) this.ytplayer.setVolume(this.props.volume);
    }
    if (fullScreen) {
      this.setFullScreen();
    }
    if (mustFadeOut) {
      this.prev_fadeOut = this.props.fadeOut;
      if (this.props.fadeOut) {
        this.doFade(this.props.fadeOut, Vars.FADE_OUT);
      }
    }
    if (mustFadeIn) {
      this.prev_fadeIn = this.props.fadeIn;
      if (this.props.fadeIn) {
        this.doFade(this.props.fadeIn, Vars.FADE_IN);
      }
    }
  }
  setFullScreen() {
    let frame = this.ytplayer.a;
    var requestFullScreen =
      frame.requestFullScreen ||
      frame.mozRequestFullScreen ||
      frame.webkitRequestFullScreen ||
      frame.msRequestFullScreen;
    if (requestFullScreen) {
      requestFullScreen.bind(frame)();
    }
    this.props.fullScreenSet();
  }
  doFade(timeSec, fade) {
    let timeMS = Math.round(timeSec * 1000);
    let totalSteps = 10;
    let stepTime = timeMS / totalSteps;
    let volumeStep = 7; //So it will step 70 total
    let curStep = 0;
    let ytplayer = this.ytplayer;
    if (fade === Vars.FADE_IN) this.ytplayer.setVolume(0);
    let fadeInt = setInterval(() => {
      if (curStep === totalSteps) {
        ytplayer.setVolume(this.props.volume);
        clearInterval(fadeInt);
      } else {
        let steps = fade === Vars.FADE_IN ? totalSteps - curStep++ : curStep++;
        let nextVolume = this.props.volume - steps * volumeStep;
        ytplayer.setVolume(nextVolume);
      }
    }, stepTime);
  }
  onStateChange = event => {
    if (!this.ytplayer) this.ytplayer = event.target;
    let ev = event.data;
    let p = this.props;

    let cued = ev === Vars.YT_CUED && this.buffered === null;
    let buffering = ev === Vars.YT_PLAYING && this.buffered === null;
    let hasbuffered = ev === Vars.YT_PLAYING && this.buffered === false;
    let skipDone = ev === Vars.YT_PLAYING && this.skipping;
    let userPaused = ev === Vars.YT_PAUSED && !p.userPause && this.isPlaying;
    let userUnPaused = ev === Vars.YT_PLAYING && p.userPause;

    if (cued) {
      this.ytplayer.mute();
      this.ytplayer.playVideo();
    } else if (buffering) {
      this.buffered = false;
      this.ytplayer.seekTo(this.props.starttime, true);
      this.ytplayer.playVideo();
    } else if (hasbuffered) {
      this.buffered = true;
      this.ytplayer.seekTo(this.props.starttime, true); //Have to reset, due to passed ms
      this.ytplayer.pauseVideo();
      this.ytplayer.unMute();
      this.props.onVideoBuffered();
    } else if (skipDone) {
      this.props.onSkipDone();
      this.skipping = false;
      this.props.onVideoBuffered();
    } else if (userPaused) {
      this.props.onUserPause(true);
    } else if (userUnPaused) {
      this.props.onUserPause(false);
    }
  };
  render() {
    const opts = {
      height: this.props.width,
      width: this.props.width,
      playerVars: {
        autoplay: 0,
        cc_load_policy: 0,
        controls: 0,
        disablekb: 1,
        enablejsapi: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        showinfo: 0,
        start: 0
      }
    };
    //Later, to fix SameSite:
    //<iframe data-src="https://www.youtube.com/embed/xxxxxxxxxxx" data-cookieconsent="marketing" frameborder="0" allowfullscreen></iframe>
    return (
      <div className="yt">
        <YouTube
          videoId={String(this.props.ytid)}
          opts={opts}
          onStateChange={this.onStateChange}
        />
      </div>
    );
  }
}
export default MusicYoutubePlayer;
