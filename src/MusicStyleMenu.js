import React from "react";

class MusicStyleMenu extends React.Component {
  render() {
    let selectedStyle = this.props.musicStyles.filter(
      x => Number(x.id) === Number(this.props.musicStyle_id)
    );
    if (selectedStyle[0]) selectedStyle = String(selectedStyle[0].style);
    return (
      <div className="stylesmenu">
        <p>Style:</p>
        <li>
          <button className="btnMusicStyle_selected">
            {selectedStyle}
            <span>&nbsp;&nbsp;&#9660;</span>
          </button>
        </li>

        <div className="styles_dropdown">
          {this.props.musicStyles.map(style => (
            <li key={style.id} className="styles_dropdown_item">
              <button
                className={
                  Number(style.id) === Number(this.props.musicStyle_id)
                    ? "btnMusicStyle_selected"
                    : ""
                }
                key={style.id}
                onClick={() => this.props.setMusicStyle(style.id)}
              >
                {style.style}
                {Number(style.id) === Number(this.props.musicStyle_id) && (
                  <img
                    src="./image/reload_icon.png"
                    className="reloadimg"
                    alt="Reload"
                    title="Reload"
                  />
                )}
              </button>
            </li>
          ))}
        </div>
      </div>
    );
  }
}
export default MusicStyleMenu;
