import React from 'react';
import { Link } from 'react-router';

import PopoverTemplateUi from './PopoverTemplateUi';
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

    let table;
    if (this.props.appointments.length > 0) {
      table = (
        <AppointmentsTableUi {...this.props} />
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
        {table}
        <div id="popover-template">
          <PopoverTemplateUi
            confirm={i18n.appointments.btnConfirm}
            cancel={i18n.appointments.btnCancel}/>
        </div>
      </div>
    );
  }
});