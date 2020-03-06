import React from "react";

class DaisyInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      readMoreStyle: { maxHeight: 0, height: 0 }
    };
    this.initState = this.state;
  }
  readLess() {
    this.setState(this.initState);
  }
  readMore() {
    this.setState({ readMoreStyle: { maxHeight: 1000 } });
  }
  render() {
    return (
      <div className="headerdropdown" onMouseLeave={() => this.readLess()}>
        <div className="headerdropsub">
          <h3>Hi, I am Daisy!</h3>
          <span>
            I'm the web's first AI DJ! I try to make the best mix possible
            within your favourite style of music. Just hit play and let me do
            the rest!
            <br />
            <br />
            Want to influence my mix? Skip songs or adjust the playlist from the
            panel below.
            <br />
            <br />
            <h4>How I mix? </h4>I mix as fluently as possible by selecting the
            best parts of tracks, skipping boring intro’s and mixing in the next
            track once I think it’s time. As you can see I also sync all
            animation to the beat, and when you skip or jump tracks, I try to
            always sync those actions within full bars! :)
          </span>
          <br />
          <h4>
            Think I could do even better?
            <button onClick={() => this.readMore()}>&nbsp;&#8681;&nbsp;</button>
          </h4>
          <div style={this.state.readMoreStyle} className="header_readmore">
            <span>
              I’m always looking for feedback to become an even better AI DJ.
              Keep in mind though, I’m using YouTube as my musical source, since
              I’m not allowed to put music online myself. YouTube has
              restrictions, which make it impossible to beatmatch using low
              cuts, for example. <br />
              However, please&nbsp;
              <a
                href="http://mailto:royschut@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                mail
              </a>
              &nbsp;me any suggestions you have!
              <br />
              <br />
              <b>Thanks for tuning in!</b>
              <br />
              <br />
              Daisy
            </span>
          </div>
        </div>
      </div>
    );
  }
}
export default DaisyInfo;
