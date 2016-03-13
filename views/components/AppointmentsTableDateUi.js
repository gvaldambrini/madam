import React from 'react';
import moment from 'moment';


// A presentational component which displays a table of all the appointments
// for the given date.
export default React.createClass({
  propTypes: {
    date: React.PropTypes.string.isRequired,
    appointments: React.PropTypes.array.isRequired,
    deleteAppointment: React.PropTypes.func.isRequired,
    editAppointment: React.PropTypes.func.isRequired
  },
  render: function() {
    const that = this;
    const appointmentRows = this.props.appointments.map(function(app, _index) {
      return (
        <tr key={app.appid} className={moment(that.props.date).isAfter(moment(), 'day') ? 'inactive' : ''} onClick={
            function(event) {
              event.preventDefault();
              event.stopPropagation();

              if (moment(that.props.date).isAfter(moment(), 'day')) {
                return;
              }
              that.props.editAppointment(app);
            }
          }>

          <td className={app.planned ? 'planned-appointment' : ''}>
            {app.fullname}
          </td>
          <td className={app.planned ? 'planned-appointment' : ''}>
            {app.planned ? i18n.homepage.planned : app.services}
          </td>
          <td className="no-padding">
            <span className="table-btn-container">
              <span
                className={
                typeof app.id === 'undefined'
                ? "glyphicon glyphicon-print table-btn hidden-xs disabled" :
                "glyphicon glyphicon-print table-btn hidden-xs"}
                data-toggle="tooltip" data-placement="left"
                title={i18n.customers.printCustomerSheet} ref={
                    function(span) {
                      if (span !== null && typeof app.id !== 'undefined') {
                        $(span).tooltip();
                      }
                    }
                }
                onClick={
                  function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    if (typeof app.id !== 'undefined') {
                      $('#customer-sheet-printer').trigger('print', [app.id]);
                    }
                  }
                }></span>
              <span onClick={function(event) {event.stopPropagation();}} className="glyphicon glyphicon-trash table-btn"
                data-toggle="tooltip" data-placement="left"
                title={i18n.homepage.deleteText} ref={
                  function(span) {
                    if (span !== null) {
                      const $span = $(span);
                      if ($span.data('tooltip-init'))
                        return;
                      $span.data('tooltip-init', true);
                      $span.tooltip();
                      $span.confirmPopover({
                        template: '#popover-template',
                        title: i18n.homepage.deleteTitle,
                        content: i18n.homepage.deleteMsg,
                        $rootContainer: $('#calendar-table-container'),
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
      <table className='table table-hover'>
        <thead>
          <tr>
            <th>{i18n.homepage.fullname}</th>
            <th>{i18n.homepage.appDetails}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
        {appointmentRows}
        </tbody>
      </table>
    );
  }
});