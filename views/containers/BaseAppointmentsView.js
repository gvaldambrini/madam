import React from 'react';
import { connect } from 'react-redux';
import moment from 'moment';

import {
  fetchAppointmentsIfNeeded,
  deleteAppointment
} from '../redux/modules/appointments';

import { AppointmentsViewUi } from '../components';


// The base appointments container that contains the related appointments table for
// a given customer.
const BaseAppointmentsView = React.createClass({
  propTypes: {
    loaded: React.PropTypes.bool.isRequired,
    appointments: React.PropTypes.array.isRequired,
    editAppointmentPath: React.PropTypes.func.isRequired,
    params: React.PropTypes.shape({
      id: React.PropTypes.string.isRequired
    }).isRequired
  },
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  componentDidMount: function() {
    this.props.dispatch(fetchAppointmentsIfNeeded(this.props.params.id));
  },
  editAppointment: function(app) {
    const date = moment(app.date, config.date_format);
    if (app.planned && date.isAfter(moment(), 'day')) {
      return;
    }
    this.context.router.push(this.props.editAppointmentPath(app));
  },
  deleteAppointment: function(app) {
    this.props.dispatch(deleteAppointment(this.props.params.id, app));
  },
  render: function() {
    return (
      <AppointmentsViewUi
        {...this.props}
        editAppointment={this.editAppointment}
        deleteAppointment={this.deleteAppointment} />
    );
  }
});


function mapStateToProps(state, ownProps) {
  const customerData = state.appointments.getIn(['customers', ownProps.params.id]);
  let appointments;
  if (typeof customerData !== 'undefined')  {
    appointments = customerData.get('appointmentList');
  }

  let name, surname;
  let loaded = false;
  if (typeof appointments !== 'undefined') {
    appointments = appointments.toJS();
    name = customerData.get('name');
    surname = customerData.get('surname');
    loaded = true;
  }
  else {
    appointments = [];
  }

  return {
    name,
    surname,
    loaded,
    appointments
  };
}

export default connect(mapStateToProps)(BaseAppointmentsView);
