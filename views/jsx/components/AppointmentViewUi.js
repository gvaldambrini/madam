import React from 'react';

import AppointmentFormUi from './AppointmentFormUi';


// The appointment main presentational component, which contains the related form.
export default React.createClass({
  propTypes: {
    errors: React.PropTypes.array.isRequired,
    date: React.PropTypes.string.isRequired,
    notes: React.PropTypes.string,
    inputChange: React.PropTypes.func.isRequired,
    services: React.PropTypes.array,
    workers: React.PropTypes.array,
    updateService: React.PropTypes.func.isRequired,
    addService: React.PropTypes.func.isRequired,
    submit: React.PropTypes.func.isRequired,
    submitText: React.PropTypes.string.isRequired,
    formTitle: React.PropTypes.string.isRequired
  },
  render: function() {
    if (typeof this.props.workers === 'undefined' || typeof this.props.services === 'undefined') {
      return (<div></div>);
    }

    if (this.props.workers.length === 0) {
      return (
        <div id="appointment-view">
          <div className="alert alert-danger" role="alert">
            <Link to="/settings/workers">{i18n.appointments.setWorkersMsg}</Link>
          </div>
        </div>
      );
    }

    if (this.props.services.length === 0) {
      return (
        <div id="appointment-view">
          <div className="alert alert-danger" role="alert">
            <Link to="/settings/services">{i18n.appointments.setServicesMsg}</Link>
          </div>
        </div>
      );
    }

    return (
      <div id="appointment-view">
        <AppointmentFormUi {...this.props}/>
      </div>
    );
  }
});