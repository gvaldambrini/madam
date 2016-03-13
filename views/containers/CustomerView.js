import React from 'react';

import { CustomerViewUi } from "../components";


// The customer main container used in the customers section.
export default React.createClass({
  propTypes: {
    params: React.PropTypes.shape({
      id: React.PropTypes.string
    }).isRequired
  },
  render: function() {
    let infoPath, appPath, appLinkDisabled;

    if (this.props.route.path.startsWith('edit')) {
      infoPath = `/customers/edit/${this.props.params.id}`;
      appPath = `/customers/edit/${this.props.params.id}/appointments`;
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