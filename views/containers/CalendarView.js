import React from 'react';
import { connect } from 'react-redux';
import moment from 'moment';

import { searchCustomers } from '../redux/modules/customers';
import {
  fetchAppointmentsByDateIfNeeded,
  planAppointment,
  deleteAppointment
} from '../redux/modules/appointments';

import { CalendarViewUi } from '../components';


// The main container used in the calendar / homepage section.
const CalendarView = React.createClass({
  propTypes: {
    loaded: React.PropTypes.bool.isRequired,
    appointments: React.PropTypes.array.isRequired,
    params: React.PropTypes.shape({
      date: React.PropTypes.string
    }).isRequired
  },
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  getInitialState: function() {
    const date = typeof this.props.params.date !== 'undefined'
      ? this.props.params.date
      : moment().format('YYYY-MM-DD');

    return {
      date: date,
      errors: []
    };
  },
  componentDidMount: function() {
    this.props.dispatch(fetchAppointmentsByDateIfNeeded(this.state.date));
  },
  componentWillReceiveProps: function(nextProps) {
    if (typeof nextProps.params.date !== 'undefined' &&
        nextProps.params.date !== this.state.date) {
      this.props.dispatch(fetchAppointmentsByDateIfNeeded(nextProps.params.date));
      this.setState({date: moment(nextProps.params.date).format('YYYY-MM-DD')});
    }
    else if (!nextProps.loaded) {
      this.props.dispatch(fetchAppointmentsByDateIfNeeded(this.state.date));
    }
  },
  fetchCustomerSuggestions: function(input, callback) {
    searchCustomers(input).then(data => callback(null, data.customers));
  },
  addAppointment: function(customer) {
    const data = {
      fullname: customer.fullname,
      id: customer.id
    };

    const that = this;
    const onError = function(xhr, _textStatus, _errorThrown) {
      that.setState({
        errors: xhr.responseJSON.errors.map(item => item.msg)
      });
    };
    const onSuccess = function(_obj) {
      that.setState({errors: []});
    };

    this.props.dispatch(
      planAppointment(this.state.date, data)
    ).then(onSuccess, onError);
  },
  editAppointment: function(app) {
    let url;
    if (typeof app.id === 'undefined') {
      url = `/calendar/${this.state.date}/appointments/planned/${app.appid}/newcustomer`;
    }
    else if (app.planned) {
      url = `/calendar/${this.state.date}/customers/${app.id}/appointments/planned/${app.appid}`;
    }
    else {
      url = `/calendar/${this.state.date}/customers/${app.id}/appointments/${app.appid}`;
    }

    this.context.router.push(url);
  },
  deleteAppointment: function(app) {
    // Bad hack required as redux expects a local formatted date.
    app.date = moment(this.state.date).format(config.date_format);
    this.props.dispatch(deleteAppointment(app.id, app));
  },
  setDate: function(date) {
    this.context.router.push(`/calendar/${moment(date).format('YYYY-MM-DD')}`);
  },
  render: function() {
    return (
      <CalendarViewUi
        date={this.state.date}
        setDate={this.setDate}
        loaded={this.props.loaded}
        appointments={this.props.appointments}
        errors={this.state.errors}
        fetchCustomerSuggestions={this.fetchCustomerSuggestions}
        deleteAppointment={this.deleteAppointment}
        editAppointment={this.editAppointment}
        addAppointment={this.addAppointment} />
    );
  }
});


function mapStateToProps(state, ownProps) {
  const date = typeof ownProps.params.date !== 'undefined'
    ? ownProps.params.date
    : moment().format('YYYY-MM-DD');

  let appointments = state.appointments.getIn(['dates', date, 'appointmentList']);
  return {
    loaded: typeof appointments !== 'undefined',
    appointments: (typeof appointments !== 'undefined') ? appointments.toJS() : []
  };
}

export default connect(mapStateToProps)(CalendarView);
