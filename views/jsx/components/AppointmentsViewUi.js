import React from 'react';
import { Link } from 'react-router';

import PopoverTemplateUi from './PopoverTemplateUi';
import AppointmentsTableUi from './AppointmentsTableUi';


// The main appointments presentational component, which includes the related table.
export default React.createClass({
  propTypes: {
    loaded: React.PropTypes.bool.isRequired,
    data: React.PropTypes.object.isRequired,
    editAppointment: React.PropTypes.func.isRequired,
    deleteAppointment: React.PropTypes.func.isRequired,
    newAppointmentPath: React.PropTypes.string.isRequired
  },
  render: function() {
    if (!this.props.loaded) {
      return <div></div>;
    }

    let table;
    if (typeof this.props.data.appointments !== 'undefined' && this.props.data.appointments.length > 0) {
      table = (
        <AppointmentsTableUi
          data={this.props.data}
          editAppointment={this.props.editAppointment}
          deleteAppointment={this.props.deleteAppointment}/>
      );
    }

    return (
      <div className="content-body">
        <Link to={this.props.newAppointmentPath} className='btn btn-primary'>
          {i18n.appointments.createNew}
        </Link>
        <p className="hidden-xs pull-right">
            {this.props.data.name} {this.props.data.surname}
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