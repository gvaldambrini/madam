import React from 'react';
import { Link } from 'react-router';


// The top navbar presentational component, which includes the "hamburger icon"
// that toggles the sidebar in the mobile version.
export default React.createClass({
  propTypes: {
    currentUser: React.PropTypes.string,
    logout: React.PropTypes.func.isRequired,
    showToggle: React.PropTypes.bool.isRequired
  },
  render: function() {
    const that = this;
    let logout;
    if (typeof this.props.currentUser !== 'undefined') {
      logout = (
        <div className="navbar-user">
          {this.props.currentUser}
          <div>
            <a href="#" onClick={
              function(event) {
                event.preventDefault();
                event.stopPropagation();
                that.props.logout();
              }
            }>{i18n.logout}</a>
          </div>
        </div>
      );
    }

    let toggle;
    if (this.props.showToggle) {
      toggle = (
        <button type="button" className="navbar-toggle" data-toggle="collapse" data-target=".sidebar">
          <span className="sr-only">Toggle navigation</span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
        </button>
      );
    }
    return (
      <nav className="navbar navbar-inverse navbar-fixed-top">
          <div className="navbar-logo">
              <Link className="logo" to="/"></Link>
          </div>
          {logout}
          {toggle}
      </nav>
    );
  }
});