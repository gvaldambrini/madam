import React from 'react';
import moment from 'moment';

import BaseAppointmentsView from './BaseAppointmentsView';


// The appointments main container used in the calendar / homepage section.
export default React.createClass({
  propTypes: {
    params: React.PropTypes.shape({
      id: React.PropTypes.string.isRequired
    }).isRequired
  },
  editAppointmentPath: function(app) {
    const date = moment(app.date, config.date_format);
    if (app.planned) {
      return `/calendar/${date.format('YYYY-MM-DD')}/customers/${this.props.params.id}/appointments/planned/${app.appid}}`;
    }
    return `/calendar/${date.format('YYYY-MM-DD')}/customers/${this.props.params.id}/appointments/${app.appid}`;
  },
  render: function() {
    const isotoday = moment().format('YYYY-MM-DD');
    return (
      <BaseAppointmentsView
        {...this.props}
        newAppointmentPath={`/calendar/${isotoday}/customers/${this.props.params.id}/appointments/new`}
        editAppointmentPath={this.editAppointmentPath}/>
    );
  }
});