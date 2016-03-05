import React from 'react';
import { Link } from 'react-router';

import AppointmentsTableUi from './AppointmentsTableUi';


// The main appointments presentational component, which includes the related table.
export default React.createClass({
  propTypes: {
    name: React.PropTypes.string,
    surname: React.PropTypes.string,
    loaded: React.PropTypes.bool.isRequired,
    appointments: React.PropTypes.array.isRequired,
    editAppointment: React.PropTypes.func.isRequired,
    deleteAppointment: React.PropTypes.func.isRequired,
    newAppointmentPath: React.PropTypes.string.isRequired
  },
  render: function() {
    if (!this.props.loaded) {
      return <div></div>;
    }

    let appointments;
    if (this.props.appointments.length > 0) {
      appointments = (
        <AppointmentsTableUi {...this.props} />
      );
    }
    else {
      appointments = (
        <div className="alert alert-info" role="alert">
          {i18n.appointments.emptyTableMsg}
        </div>
      );
    }

    return (
      <div className="content-body">
        <Link to={this.props.newAppointmentPath} className='btn btn-primary'>
          {i18n.appointments.createNew}
        </Link>
        <p className="hidden-xs pull-right">
            {this.props.name} {this.props.surname}
        </p>
        <div className="appointment-table-container">
        {appointments}
        </div>
      </div>
    );
  }
});