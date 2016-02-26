import React from 'react';
import { Link } from 'react-router';

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
    loaded: React.PropTypes.bool.isRequired,
    updateService: React.PropTypes.func.isRequired,
    addService: React.PropTypes.func.isRequired,
    submit: React.PropTypes.func.isRequired,
    submitText: React.PropTypes.string.isRequired,
    formTitle: React.PropTypes.string.isRequired
  },
  render: function() {
    if (!this.props.loaded) {
      return (<div></div>);
    }
    let content;

    if (this.props.workers.length === 0) {
      content = (
        <div className="alert alert-danger" role="alert">
          <Link to="/settings/workers">{i18n.appointments.setWorkersMsg}</Link>
        </div>
      );
    }
    else if (this.props.services.length === 0) {
      content = (
        <div className="alert alert-danger" role="alert">
          <Link to="/settings/services">{i18n.appointments.setServicesMsg}</Link>
        </div>
      );
    }
    else {
      content = (
        <AppointmentFormUi {...this.props}/>
      );
    }

    return (
      <div id="appointment-view" className="content-body">
        {content}
      </div>
    );
  }
});