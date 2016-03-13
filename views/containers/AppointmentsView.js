import React from 'react';
import moment from 'moment';

import BaseAppointmentsView from './BaseAppointmentsView';


// The appointments main container used in the customers section.
export default React.createClass({
  propTypes: {
    params: React.PropTypes.shape({
      id: React.PropTypes.string.isRequired
    }).isRequired
  },
  editAppointmentPath: function(app) {
    const date = moment(app.date, config.date_format);
    if (app.planned) {
      return `/customers/edit/${this.props.params.id}/appointments/planned/${date.format('YYYY-MM-DD')}/${app.appid}`;
    }
    return `/customers/edit/${this.props.params.id}/appointments/edit/${app.appid}`;
  },
  render: function() {
    return (
      <BaseAppointmentsView
        {...this.props}
        newAppointmentPath={`/customers/edit/${this.props.params.id}/appointments/new`}
        editAppointmentPath={this.editAppointmentPath}/>
    );
  }
});