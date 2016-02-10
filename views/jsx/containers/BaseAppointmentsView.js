import React from 'react';
import moment from 'moment';

import { fnFetchData } from './util';
import { AppointmentsViewUi } from '../components';


// The base appointments container that contains the related appointments table for
// a given customer.
export default React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  getInitialState: function() {
    return {
      data: {},
      loaded: false
    };
  },
  componentWillMount: function() {
    this.updateTable();
  },
  updateTable: function() {
    fnFetchData(this, `/customers/${this.props.params.id}/appointments`);
  },
  editAppointment: function(app) {
    const date = moment(app.date, config.date_format);
    if (app.planned && date.isAfter(moment(), 'day')) {
      return;
    }
    this.context.router.push(this.props.editAppointmentPath(app));
  },
  deleteAppointment: function(app) {
    let url;
    if (app.planned) {
      url = `/customers/planned-appointments/${moment(app.date, config.date_format).format('YYYY-MM-DD')}/${app.appid}`;
    }
    else {
      url = `/customers/${this.props.params.id}/appointments/${app.appid}`;
    }
    $.ajax({
      url: url,
      method: 'delete',
      complete: this.updateTable
    });
  },
  render: function() {
    return (
      <AppointmentsViewUi
        data={this.state.data}
        loaded={this.state.loaded}
        newAppointmentPath={this.props.newAppointmentPath}
        editAppointment={this.editAppointment}
        deleteAppointment={this.deleteAppointment}/>
    );
  }
});