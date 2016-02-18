import React from 'react';

import { CustomerViewUi } from "../components";


// The customer main container used in the calendar / homepage section.
export default React.createClass({
  render: function() {
    let infoPath, appPath, appLinkDisabled;

    if (this.props.location.pathname.indexOf('newcustomer') === -1) {
      infoPath = `/calendar/${this.props.params.date}/customers/${this.props.params.id}/`;
      appPath = `/calendar/${this.props.params.date}/customers/${this.props.params.id}/appointments`;
      appLinkDisabled = false;
    }
    else {
      infoPath = '';
      appPath = '';
      appLinkDisabled = true;
    }
    return (
      <CustomerViewUi
        infoPath={infoPath}
        appPath={appPath}
        appLinkDisabled={appLinkDisabled}>
        {this.props.children}
      </CustomerViewUi>
    );
  }
});