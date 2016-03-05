import React from 'react';


// A presentational component that can be used to show a popover with
// a confirm and a cancel button.
export default React.createClass({
  propTypes: {
    confirm: React.PropTypes.string.isRequired,
    cancel: React.PropTypes.string.isRequired
  },
  render: function() {
    return (
      <div className="popover" role="tooltip">
        <div className="arrow"></div>
        <h3 className="popover-title"></h3>

        <div className="popover-body">
          <div className="popover-content"></div>
          <button type="submit" className="btn btn-primary btn-confirm" name="submit">
            {this.props.confirm}
          </button>
          <button type="submit" className="btn btn-default btn-cancel" name="submit">
            {this.props.cancel}
          </button>
        </div>
      </div>
    );
  }
});