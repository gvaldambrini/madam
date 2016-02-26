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
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  propTypes: {
    loaded: React.PropTypes.bool.isRequired,
    appointments: React.PropTypes.array.isRequired
  },
  componentDidMount: function() {
    this.props.dispatch(fetchAppointmentsIfNeeded(this.props.params.id));
  },
  componentWillReceiveProps: function(_nextProps) {
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
  const loaded = state.appointments.hasIn(['customers', ownProps.params.id]);
  let appointments = [];
  let name, surname;
  if (loaded) {
    appointments = state.appointments.getIn(
      ['customers', ownProps.params.id, 'appointmentList']).toJS();
    name = state.appointments.getIn(['customers', ownProps.params.id, 'name']);
    surname = state.appointments.getIn(['customers', ownProps.params.id, 'surname']);
  }

  return {
    name,
    surname,
    loaded,
    appointments
  };
}

export default connect(mapStateToProps)(BaseAppointmentsView);
