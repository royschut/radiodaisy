import React from "react";
import axios from "axios";
import Constants from "./Vars";

class DataDelegate extends React.Component {
  static ACT_INSERTSONG = 1;
  static ACT_GETPLAYLISTBYSTYLE = 2;
  static ACT_UPDATESONG = 3;
  static ACT_GETMUSICSTYLES = 4;

  isLoading = false;

  talkWithServer(talkObj, callBack) {
    axios(talkObj).then(
      result => {
        this.isLoading = false;
        if (result.data.success) {
          callBack(result.data);
        } else {
          console.log("error", result);
        }
      },
      error => {
        this.isLoading = false;
        console.log("error: " + error.message);
      }
    );
  }
  componentDidUpdate() {
    if (this.props.doLoad && this.props.action && !this.isLoading) {
      let talkObj = {};
      let callBack = this.props.callBack;
      switch (this.props.action) {
        case DataDelegate.ACT_INSERTSONG:
          talkObj = {
            method: "post",
            url: Constants.API_PATH + "?method=insertsong",
            data: JSON.stringify(this.props.data)
          };
          break;
        case DataDelegate.ACT_UPDATESONG:
          talkObj = {
            method: "post",
            url: Constants.API_PATH + "?method=updatesong",
            data: JSON.stringify(this.props.data)
          };
          break;
        case DataDelegate.ACT_GETPLAYLISTBYSTYLE:
          talkObj = {
            method: "get",
            url:
              Constants.API_PATH +
              "?method=getplaylistbystyle&style_id=" +
              this.props.data
          };
          break;
        case DataDelegate.ACT_GETMUSICSTYLES:
          talkObj = {
            method: "get",
            url: Constants.API_PATH + "?method=getmusicstyles"
          };
          break;
        default:
          break;
      }
      this.isLoading = true;
      this.talkWithServer(talkObj, callBack);
    }
  }
  render() {
    return "";
  }
}
export default DataDelegate;
