import React from 'react';

import BaseAppointmentView from './BaseAppointmentView';


// The appointment main container used in the customers section and that contains
// the related form.
export default React.createClass({
  render: function() {
    return (
      <BaseAppointmentView
        {...this.props}
        destPath={`/customers/edit/${this.props.params.id}/appointments`}/>
    );
  }
});