let API_PATH = "/daisydata.php";
if (process.env.NODE_ENV === "development") {
  API_PATH = "http://localhost:80/daisydata.php";
}

export default {
  API_PATH: API_PATH,
  STATUS_INIT: 0,
  STATUS_LOADING: 1,
  STATUS_BUFFERING: 2,
  STATUS_READY: 3,

  MUSICSTYLE_90s: 1,
  MUSICSTYLE_80s: 2,
  MUSICSTYLE_70s: 3,
  MUSICSTYLE_POPMODERN: 4,
  MUSICSTYLE_00s: 5,
  MUSICSTYLE_DEFAULT: 1,
  BPM_RANGE_MIN: 70,

  MT_NORMAL: 1,
  MT_FAST: 2,
  MT_SLOW: 3,
  MT_DEFAULT: 1,
  MIXTYPES: [1, 2, 3],
  MIXTYPES_STRINGS: ["Normal", "Fast", "Slow"],

  FADE_IN: 1,
  FADE_OUT: 2,

  CT_START: 1,
  CT_STOP: 2,
  CT_PRE_OVER: 3,
  CT_FADE_IN: 4,
  CT_FADE_OUT: 5,
  CT_SKIP_IN: 6,
  CT_SKIP_OUT: 7,
  CUETYPES: [
    { id: 0, type: "Nothing" },
    { id: 1, type: "Start" },
    { id: 2, type: "Stop" },
    { id: 3, type: "Prestart_overlap" },
    { id: 4, type: "Fade_in" },
    { id: 5, type: "Fade_out" },
    { id: 6, type: "Skip_in" },
    { id: 7, type: "Skip_out" }
  ],

  YT_UNSTARTED: -1,
  YT_ENDED: 0,
  YT_PLAYING: 1,
  YT_PAUSED: 2,
  YT_BUFFERING: 3,
  YT_CUED: 5
};
