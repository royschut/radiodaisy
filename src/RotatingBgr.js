import React from "react";
import { shuffleArray } from "./Tools";

class RotatingBgr extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      imgURL: ""
    };

    this.imgDuration = 15000;
    this.curIndex = -1;
    this.prev_images = [];
  }
  componentDidUpdate() {
    //check if updated
    if (this.props.images) {
      if (this.props.images.join("") !== this.prev_images.join("")) {
        this.prev_images = this.props.images;
        this.retrieveImages();
      }
    }
  }
  retrieveImages() {
    this.images = shuffleArray(this.props.images.slice());
    this.curIndex = -1;
    this.rotateBgr();
  }
  rotateBgr() {
    if (this.timeout) clearTimeout(this.timeout);
    if (this.curIndex++ === this.images.length - 1) this.curIndex = 0;

    let imgId = this.images[this.curIndex];
    this.bufferImage(imgId);
    this.timeout = setTimeout(() => this.rotateBgr(), this.imgDuration);
  }
  imgURL(imgId) {
    return "./image/bgr/bgr" + imgId + ".jpg";
  }
  bufferImage(imgId) {
    //Loads the full image first, before it gets put into DOM
    var img = new Image();
    let imgURL = this.imgURL(imgId);
    img.onload = () => {
      this.setState({
        imgURL: imgURL
      });
    };
    img.src = imgURL;
  }
  render() {
    let bgrStyle = {
      backgroundImage: "url(" + this.state.imgURL + ")",
      backgroundPosition: "center",
      backgroundSize: "cover"
    };
    if (!this.props.images) bgrStyle = {};
    return <div style={bgrStyle} className="rotatingbgr" />;
  }
}
export default RotatingBgr;
