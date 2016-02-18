import React from 'react';

import SidebarUi from './SidebarUi';


// The main content presentational component which includes the sidebar and displays
// the children.
export default React.createClass({
  render: function() {
    return (
      <div className="row">
        <SidebarUi/>
        <div className="col-sm-10 col-sm-offset-2 main">
          {this.props.children}
        </div>
      </div>
    );
  }
});