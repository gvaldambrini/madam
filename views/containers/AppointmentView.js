import React from 'react';

import BaseAppointmentView from './BaseAppointmentView';


// The appointment main container used in the customers section and that contains
// the related form.
export default React.createClass({
  propTypes: {
    params: React.PropTypes.shape({
      id: React.PropTypes.string.isRequired
    }).isRequired
  },
  render: function() {
    return (
      <BaseAppointmentView
        {...this.props}
        destPath={`/customers/edit/${this.props.params.id}/appointments`}/>
    );
  }
});