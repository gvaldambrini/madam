import React from 'react';
import moment from 'moment';

import {
  fnFetchData,
  fnSubmitForm
} from './util';
import { CalendarViewUi } from '../components';


// The main container used in the calendar / homepage section.
export default React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  getInitialState: function() {
    const date = typeof this.props.params.date !== 'undefined'
      ? this.props.params.date
      : moment().format('YYYY-MM-DD');

    return {
      date: date,
      data: {},
      loaded: false,
      errors: []
    };
  },
  componentWillMount: function() {
    this.updateTable();
  },
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.params.date !== this.state.date) {
      this.updateTable(nextProps.params.date);
      this.setState({date: moment(nextProps.params.date).format('YYYY-MM-DD')});
    }
  },
  fetchCustomerSuggestions: function(input, callback) {
    const that = this;
    $.ajax({
      url: '/customers/simple-search',
      method: 'get',
      data: {text: input, size: 10},
      success: data => callback(null, data.customers),
      error: function(xhr, textStatus, _errorThrown) {
        if (xhr.status === 401) {
          that.context.router.push('/login');
        }
      }
    });
  },
  updateTable: function(date) {
    fnFetchData(this, '/customers/appointments/' + (typeof date === 'undefined' ? this.state.date : date));
  },
  addAppointment: function(customer) {
    const that = this;
    const data = {
      fullname: customer.fullname,
      id: customer.id
    };
    const url = `/customers/planned-appointments/${this.state.date}`;
    fnSubmitForm(this, url, 'post', data, function(response) {
      const appointments = that.state.data.appointments;
      appointments.push({
        appid: response.id,
        fullname: data.fullname,
        id: data.id,
        planned: true
      });
      that.setState({data: {appointments: appointments}});
    });
  },
  editAppointment: function(app) {
    if (typeof app.id === 'undefined') {
      this.context.router.push(
        `/calendar/${this.state.date}/appointments/planned/${app.appid}/newcustomer`);
      return;
    }
    if (app.planned) {
      this.context.router.push(
        `/calendar/${this.state.date}/customers/${app.id}/appointments/planned/${app.appid}`);
      return;
    }

    this.context.router.push(
      `/calendar/${this.state.date}/customers/${app.id}/appointments/${app.appid}`);
  },
  deleteAppointment: function(app) {
    let url;
    if (app.planned) {
      url = `/customers/planned-appointments/${this.state.date}/${app.appid}`;
    }
    else {
      url = `/customers/${app.id}/appointments/${app.appid}`;
    }

    $.ajax({
      url: url,
      method: 'delete',
      complete: () => this.updateTable()
    });
  },
  setDate: function(date) {
    this.context.router.push(`/calendar/${moment(date).format('YYYY-MM-DD')}`);
  },
  render: function() {
    return (
      <CalendarViewUi
        date={this.state.date}
        setDate={this.setDate}
        loaded={this.state.loaded}
        data={this.state.data}
        errors={this.state.errors}
        fetchCustomerSuggestions={this.fetchCustomerSuggestions}
        deleteAppointment={this.deleteAppointment}
        editAppointment={this.editAppointment}
        addAppointment={this.addAppointment} />
    );
  }
});