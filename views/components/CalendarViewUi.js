import React from 'react';
import moment from 'moment';

import { fnRenderErrors } from './util';
import PopoverTemplateUi from './PopoverTemplateUi';
import AppointmentsTableDateUi from './AppointmentsTableDateUi';
import PlanAppointmentFormUi from './PlanAppointmentFormUi';


// The main presentational component used in the calendar / homepage section.
export default React.createClass({
  propTypes: {
    date: React.PropTypes.string.isRequired,
    setDate: React.PropTypes.func.isRequired,
    loaded: React.PropTypes.bool.isRequired,
    appointments: React.PropTypes.array.isRequired,
    errors: React.PropTypes.array.isRequired,
    fetchCustomerSuggestions: React.PropTypes.func.isRequired,
    deleteAppointment: React.PropTypes.func.isRequired,
    editAppointment: React.PropTypes.func.isRequired,
    addAppointment: React.PropTypes.func.isRequired
  },
  render: function() {
    const that = this;
    if (!this.props.loaded) {
      return <div></div>;
    }

    let appointments;
    if (this.props.appointments.length > 0) {
      appointments = (
        <AppointmentsTableDateUi
          appointments={this.props.appointments}
          date={this.props.date}
          deleteAppointment={this.props.deleteAppointment}
          editAppointment={this.props.editAppointment}/>
      );
    }

    let planAppointmentForm;
    if (moment(this.props.date).isAfter(moment(), 'day') ||
        moment(this.props.date).isSame(moment(), 'day'))
      planAppointmentForm = (
        <PlanAppointmentFormUi
          plan={this.props.addAppointment}
          fetchCustomerSuggestions={this.props.fetchCustomerSuggestions}/>
      );

    return (
      <div id="calendar-table-container" className="content-body">
        {fnRenderErrors(this.props.errors)}
        <div className='date-selector-header'>
          <span className="glyphicon glyphicon-menu-left" onClick={function(event) {
            const date = moment(that.props.date).subtract(1, 'days');
            that.props.setDate(date);
            const $dateSelector = $(event.currentTarget)
              .closest('.date-selector-header')
              .find('.date-selector');
            $dateSelector.datepicker('setDate', date.format(config.date_format));
          }}/>
          <span className="date-selector" data-provide="datepicker" ref={
            function(span) {
              $(span).datepicker().off('changeDate').on(
                'changeDate', event => that.props.setDate(moment(event.date.toISOString()))
              );
            }
          }>
            {moment(this.props.date).format(config.date_format)}
          </span>
          <span className="glyphicon glyphicon-menu-right" onClick={function(event) {
            const date = moment(that.props.date).add(1, 'days');
            that.props.setDate(date);
            const $dateSelector = $(event.currentTarget)
              .closest('.date-selector-header')
              .find('.date-selector');
            $dateSelector.datepicker('setDate', date.format(config.date_format));
          }}/>
        </div>
        <h4>{i18n.homepage.appointments}</h4>
        {appointments}
        {planAppointmentForm}
        <div id="popover-template">
          <PopoverTemplateUi
            confirm={i18n.homepage.btnConfirm}
            cancel={i18n.homepage.btnCancel}/>
        </div>
      </div>
    );
  }
});