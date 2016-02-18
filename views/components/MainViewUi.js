import React from 'react';

import NavbarUi from './NavbarUi';


// The main view presentational component (the whole page).
export default React.createClass({
  propTypes: {
    showToggle: React.PropTypes.bool.isRequired,
    currentUser: React.PropTypes.string,
    logout: React.PropTypes.func.isRequired
  },
  render: function() {
    return (
      <div className="container-fluid">
        <NavbarUi
          showToggle={this.props.showToggle}
          currentUser={this.props.currentUser}
          logout={this.props.logout}/>
        {this.props.children}
      </div>
    );
  }
});