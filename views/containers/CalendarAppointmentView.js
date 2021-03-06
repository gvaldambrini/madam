import React from 'react';

import BaseAppointmentView from './BaseAppointmentView';


// The appointment main container used in the calendar / homepage section and
// that contains the related form.
export default React.createClass({
  propTypes: {
    params: React.PropTypes.shape({
      date: React.PropTypes.string.isRequired
    }).isRequired
  },
  render: function() {
    return (
      <BaseAppointmentView
        {...this.props}
        destPath={`/calendar/${this.props.params.date}`}/>
    );
  }
});