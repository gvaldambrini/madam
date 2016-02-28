import React from 'react';
import moment from 'moment';


// The appointments table presentational component.
export default React.createClass({
  propTypes: {
    appointments: React.PropTypes.array.isRequired,
    editAppointment: React.PropTypes.func.isRequired,
    deleteAppointment: React.PropTypes.func.isRequired
  },
  render: function() {
    const that = this;
    const appointmentRows = this.props.appointments.map(function(app) {
      const appClass = app.planned ? 'planned-appointment' : '';
      const date = moment(app.date, config.date_format);
      return (
        <tr key={app.appid}
          className={date > moment() ? 'inactive' : ''}
          onClick={
            function(event) {
              event.preventDefault();
              event.stopPropagation();
              that.props.editAppointment(app);
            }
          }>
          <td className={appClass}>{app.date}</td>
          <td className={appClass}>{app.planned ? i18n.appointments.planned : app.services}</td>
          <td className="no-padding">
            <span className="table-btn-container">
              <span
                onClick={function(event) {event.stopPropagation();}}
                className="table-btn glyphicon glyphicon-trash"
                data-toggle="tooltip" data-placement="left"
                title={i18n.appointments.deleteText} ref={
                  function(span) {
                    if (span !== null) {
                      const $span = $(span);
                      if ($span.data('tooltip-init'))
                        return;
                      $span.data('tooltip-init', true);
                      $span.tooltip();
                      $span.confirmPopover({
                        template: '#popover-template',
                        title: i18n.appointments.deleteTitle,
                        content: i18n.appointments.deleteMsg,
                        $rootContainer: $('#appointments-table-container'),
                        onConfirm: () => that.props.deleteAppointment(app)
                      });
                    }
                  }
                }></span>
              </span>
          </td>
        </tr>
      );
    });

    return (
      <div className="table-responsive" id='appointments-table-container'>
        <table className='table table-hover'>
          <thead>
            <tr>
              <th>{i18n.appointments.date}</th>
              <th>{i18n.appointments.details}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {appointmentRows}
          </tbody>
        </table>
      </div>
    );
  }
});