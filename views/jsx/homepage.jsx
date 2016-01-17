import React from 'react';

import { History, Link, IndexLink } from 'react-router';
import Autosuggest from 'react-autosuggest';

import Cookies from 'js-cookie';
import moment from 'moment';

import { PopoverTemplate, BaseTableContainer } from './tables';
import { fnSubmitForm, fnRenderErrors } from './forms';
import { AppointmentFormContainer, AppointmentsTable } from './appointments';
import { CustomerFormContainer } from './customers';


const InputCustomer = React.createClass({
  mixins: [History],
  propTypes: {
    setCustomer: React.PropTypes.func.isRequired,
    getCustomer: React.PropTypes.func.isRequired
  },
  inputAttr: function() {
    return {
      placeholder: i18n.homepage.customerPlaceholder,
      className: 'form-control',
      onChange: this.onInputChanged,
      id: 'input-customer'
    };
  },
  onInputChanged: function(value) {
    if (this._suggestion_selected) {
      // Skip events generated from the suggestions.
      this._suggestion_selected = undefined;
      return;
    }

    this.props.setCustomer({
      fullname: value,
      id: undefined
    });
  },
  getSuggestions: function(input, callback) {
    const that = this;
    $.ajax({
      url: '/customers/simple-search',
      method: 'get',
      data: {text: input, size: 10},
      success: data => callback(null, data.customers),
      error: function(xhr, textStatus, errorThrown) {
        if (xhr.status === 401) {
          Cookies.remove('user');
          that.history.pushState(null, '/login');
        }
      }
    });
  },
  renderSuggestion:
    (suggestion, input) =>
    typeof suggestion.surname != 'undefined'
    ? `${suggestion.name} ${suggestion.surname}`
    : suggestion.name,
  getSuggestionValue:
    suggestion =>
    typeof suggestion.surname != 'undefined'
    ? `${suggestion.name} ${suggestion.surname}`
    : suggestion.name,
  onSuggestionSelected: function(suggestion, event) {
    event.preventDefault();
    this.props.setCustomer({
      fullname: this.getSuggestionValue(suggestion),
      id: suggestion.id
    });
    this._suggestion_selected = 1;
  },
  render: function() {
    return (
      <Autosuggest
        suggestions={this.getSuggestions}
        suggestionRenderer={this.renderSuggestion}
        onSuggestionSelected={this.onSuggestionSelected}
        suggestionValue={this.getSuggestionValue}
        inputAttributes={this.inputAttr()}
        value={this.props.getCustomer().fullname}
       />
    );
  }
});


var PlanAppointmentForm = React.createClass({
  getInitialState: function() {
    return {
      customer: {
        fullname: '',
        id: undefined
      }
    }
  },
  getCustomer: function() {
    return this.state.customer;
  },
  setCustomer: function(customer) {
    this.setState({customer: customer});
  },
  handleSubmit: function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.state.customer.fullname === '')
      return;

    this.props.plan(this.state.customer);
    this.setState({
      customer: {
        fullname: '',
        id: undefined
      }});
  },
  render: function() {
    return (
      <form className="form-horizontal col-sm-12">
        <label className="control-label col-sm-4" htmlFor='input-customer'>
          {i18n.homepage.planAppointment}
        </label>
        <div className="form-group input-group col-sm-8">
          <InputCustomer
            getCustomer={this.getCustomer}
            setCustomer={this.setCustomer}/>
          <span className="input-group-btn">
            <button type="button" className="btn btn-primary" name="submit" onClick={this.handleSubmit}>
              {i18n.homepage.plan}
            </button>
          </span>
        </div>
      </form>
    );
  }
});


const DateAppointments = React.createClass({
  mixins: [History],
  render: function() {
    const that = this;
    const appointmentRows = this.props.appointments.map((app, index) =>
      <tr key={app.appid} className={moment(this.props.date).isAfter(moment(), 'day') ? 'inactive' : ''} onClick={
          function(event) {
            event.preventDefault();
            event.stopPropagation();

            if (moment(that.props.date).isAfter(moment(), 'day')) {
              return;
            }
            if (typeof app.id === 'undefined') {
              that.history.pushState(
                null, `/calendar/${that.props.date}/appointments/planned/${app.appid}/newcustomer`);
              return;
            }
            if (app.planned) {
              that.history.pushState(
                null, `/calendar/${that.props.date}/customers/${app.id}/appointments/planned/${app.appid}`);
              return;
            }

            that.history.pushState(
              null, `/calendar/${that.props.date}/customers/${app.id}/appointments/${app.appid}`);
          }
        }>

        <td className={app.planned ? 'planned-appointment' : ''}>
          {app.fullname}
        </td>
        <td className={app.planned ? 'planned-appointment' : ''}>
          {app.planned ? i18n.homepage.planned : app.services}
        </td>
        <td className="no-padding">
          <span onClick={function(event) {event.stopPropagation();}} className="pull-right glyphicon glyphicon-trash"
            data-toggle="tooltip" data-placement="left"
            title={i18n.homepage.deleteText} ref={
              function(span) {
                if (span != null) {
                  var $span = $(span);
                  if ($span.data('tooltip-init'))
                    return;
                  $span.data('tooltip-init', true);
                  $span.tooltip();
                  $span.confirmPopover({
                    template: '#popover-template',
                    title: i18n.homepage.deleteTitle,
                    content: i18n.homepage.deleteMsg,
                    $rootContainer: $('#calendar-table-container'),
                    onConfirm: () => that.props.deleteItem(app)
                  });
                }
              }
            }></span>
        </td>
      </tr>
    );

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


var CalendarCustomerForm = React.createClass({
  mixins: [History],
  doSubmit: function(self, data, targetName) {
    const that = this;
    const editForm = typeof this.props.params.id !== 'undefined';
    const url = editForm ? '/customers/' + this.props.params.id : '/customers';
    const method = editForm ? 'put': 'post';
    data.__appid = this.props.params.appid;

    fnSubmitForm(self, url, method, data, function(obj) {
      if (editForm) {
        that.history.pushState(null, `/calendar/${that.props.params.date}`);
      }
      else {
        that.history.pushState(
          null, `/calendar/${that.props.params.date}/customers/${obj.id}/appointments/planned/${that.props.params.appid}`);
      }
    });
  },
  render: function() {
    const that = this;
    const editForm = typeof this.props.params.id !== 'undefined';
    let submitText, formTitle, customLoad;

    if (editForm) {
      submitText = i18n.homepage.submitEditCustomer;
      formTitle = i18n.homepage.editCustomer;
    }
    else {
      submitText = i18n.homepage.submitNewCustomer;
      formTitle = i18n.homepage.createNewCustomer;
      customLoad = function(self) {
        $.ajax({
          url: `/customers/planned-appointments/${that.props.params.date}/${that.props.params.appid}`,
          method: 'get',
          success: function(data) {
            const name = data.fullname.split(' ', 1)[0];
            const surname = data.fullname.substr(name.length + 1);
            self.setState({
              data: {
                name: name,
                surname: surname
              },
              errors: []
            });
          }
        });
      };
    }

    return (
      <CustomerFormContainer
        doSubmit={this.doSubmit}
        submitText={submitText}
        formTitle={formTitle}
        id={this.props.params.id}
        customLoad={customLoad}
      />
    );
  }
});


const CalendarCustomerAppointments = React.createClass({
  mixins: [History],
  handleRowClick(app) {
    const date = moment(app.date, config.date_format);
    if (app.planned) {
      if (date.isAfter(moment(), 'day')) {
        return;
      }
      this.history.pushState(
        null,
        `/calendar/${date.format('YYYY-MM-DD')}/customers/${this.props.customer}/appointments/planned/${app.appid}}`);
    }
    else {
      this.history.pushState(
        null,
        `/calendar/${date.format('YYYY-MM-DD')}/customers/${this.props.customer}/appointments/${app.appid}`);
    }
  },
  render: function() {
    return (
        <AppointmentsTable
          customer={this.props.customer}
          data={this.props.data}
          updateTable={this.props.updateTable}
          handleRowClick={this.handleRowClick}/>
    );
  }
});


const CalendarAppointments = React.createClass({
  mixins: [BaseTableContainer],
  getInitialState: function() {
    return {
      data: [],
      loaded: false
    };
  },
  componentWillMount: function() {
    this.updateTable();
  },
  updateTable: function() {
    this.fetchData(`/customers/${this.props.params.id}/appointments`);
  },
  render: function() {
    if (!this.state.loaded) {
      return <div></div>;
    }

    let table;
    if (typeof this.state.data.appointments !== 'undefined' && this.state.data.appointments.length > 0) {
      table =  (
        <CalendarCustomerAppointments
          customer={this.props.params.id}
          data={this.state.data.appointments}
          updateTable={this.updateTable}/>
      );
    }
    const isotoday = moment().format('YYYY-MM-DD');
    return (
      <div className="content-body">
        <Link to={`/calendar/${isotoday}/customers/${this.props.params.id}/appointments/new`} className='btn btn-primary'>
          {i18n.appointments.createNew}
        </Link>
        <p className="hidden-xs pull-right">{this.state.data.name} {this.state.data.surname}</p>
        {table}
        <div id="popover-template">
          <PopoverTemplate confirm={i18n.appointments.btnConfirm} cancel={i18n.appointments.btnCancel}/>
        </div>
      </div>
    );
  }
});


const CalendarCustomer = React.createClass({
  render: function() {
    let infoLink;
    let appLink;

    if (this.props.location.pathname.indexOf('newcustomer') === -1) {
      infoLink = (
        <IndexLink to={`/calendar/${this.props.params.date}/customers/${this.props.params.id}/`} activeClassName="active">
          {i18n.customers.headerInfo}
        </IndexLink>
      );
      appLink = (
        <Link to={`/calendar/${this.props.params.date}/customers/${this.props.params.id}/appointments`} activeClassName="active">
          {i18n.customers.headerAppointments}
        </Link>
      );
    }
    else {
      infoLink = (
        <Link to='' className="active" onClick={function(e) {e.preventDefault();}}>
          {i18n.customers.headerInfo}
        </Link>
      );
      appLink = (
        <Link to='' className="disabled">
          {i18n.customers.headerAppointments}
        </Link>
      );
    }

    return (
      <div>
        <div className="content-header">
          <ul>
            <li role="presentation">
              {infoLink}
            </li>
            <li role="presentation">
              {appLink}
            </li>
          </ul>
        </div>
        {this.props.children}
      </div>
    );
  }
});


const CalendarAppointment = React.createClass({
  mixins: [History],
  doSubmit: function(self, data) {
    const editForm = typeof this.props.params.appid != 'undefined';

    let url;
    if (editForm) {
      url = `/customers/${this.props.params.id}/appointments/${this.props.params.appid}`
    }
    else {
      url = `/customers/${this.props.params.id}/appointments`
    }
    const method = editForm ? 'put': 'post';

    fnSubmitForm(
      self, url, method, data, () => this.history.pushState(null, `/calendar/${this.props.params.date}`));
  },
  render: function() {
    let submitText, formTitle, editForm, urlData, date;
    if (this.props.location.pathname.indexOf('planned') !== -1) {
      submitText = i18n.appointments.confirmAppointment;
      formTitle = i18n.appointments.titleConfirmAppointment;
      editForm = false;
      date = this.props.params.date;
    }
    else if (typeof this.props.params.appid !== 'undefined') {
      submitText = i18n.appointments.submitEdit;
      formTitle = i18n.appointments.titleEdit;
      editForm = true;
      urlData = `/customers/${this.props.params.id}/appointments/${this.props.params.appid}`;
    }
    else {
      submitText = i18n.appointments.submitAdd;
      formTitle = i18n.appointments.titleNew;
      editForm = false;
    }

    return (
      <AppointmentFormContainer
        doSubmit={this.doSubmit}
        submitText={submitText}
        formTitle={formTitle}
        editForm={editForm}
        urlData={urlData}
        date={date}/>
    );
  }
});


const Calendar = React.createClass({
  mixins: [BaseTableContainer, History],
  getInitialState: function() {
    const date = typeof this.props.params.date !== 'undefined'
      ? this.props.params.date
      : moment().format('YYYY-MM-DD');

    return {
      date: date,
      data: [],
      loaded: false,
      errors: []
    }
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
  updateTable: function(date) {
    this.fetchData('/customers/appointments/' + (typeof date === 'undefined' ? this.state.date : date));
  },
  deleteItem: function(app) {
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
  addAppointment: function(customer) {
    const that = this;
    const data = {
      fullname: customer.fullname,
      id: customer.id
    };
    const url = `/customers/planned-appointments/${this.state.date}`;
    fnSubmitForm(this, url, 'post', data, function(response) {
      var appointments = that.state.data.appointments;
      appointments.push({
        appid: response.id,
        fullname: data.fullname,
        id: data.id,
        planned: true
      });
      that.setState({data: {appointments: appointments}});
    });
  },
  setDate: function(date) {
    this.history.pushState(null, `/calendar/${moment(date).format('YYYY-MM-DD')}`);
  },
  render: function() {
    const that = this;
    if (!this.state.loaded) {
      return <div></div>
    }

    let appointments;
    if (this.state.data.appointments.length > 0) {
      appointments = (
        <DateAppointments
          appointments={this.state.data.appointments}
          date={this.state.date}
          deleteItem={this.deleteItem}/>
      );
    }

    let planAppointmentForm;
    if (moment(this.state.date).isAfter(moment(), 'day') ||
        moment(this.state.date).isSame(moment(), 'day'))
      planAppointmentForm = <PlanAppointmentForm plan={this.addAppointment}/>;

    return (
      <div id="calendar-table-container" className="content-body">
        {fnRenderErrors(this.state.errors)}
        <div className='date-selector-header'>
          <span className="glyphicon glyphicon-menu-left" onClick={function(event) {
            const date = moment(that.state.date).subtract(1, 'days');
            that.setDate(date);
            const $dateSelector = $(event.currentTarget).closest('.date-selector-header').find('.date-selector');
            $dateSelector.datepicker('setDate', date.format(config.date_format));
          }}/>
          <span className="date-selector" data-provide="datepicker" ref={
            function(span) {
              $(span).datepicker().off('changeDate').on(
                'changeDate', event => that.setDate(moment(event.date.toISOString()))
              );
            }
          }>
            {moment(this.state.date).format(config.date_format)}
          </span>
          <span className="glyphicon glyphicon-menu-right" onClick={function(event) {
            const date = moment(that.state.date).add(1, 'days');
            that.setDate(date);
            const $dateSelector = $(event.currentTarget).closest('.date-selector-header').find('.date-selector');
            $dateSelector.datepicker('setDate', date.format(config.date_format));
          }}/>
        </div>
        <h4>{i18n.homepage.appointments}</h4>
        {appointments}
        {planAppointmentForm}
        <div id="popover-template">
          <PopoverTemplate confirm={i18n.homepage.btnConfirm} cancel={i18n.homepage.btnCancel}/>
        </div>
      </div>
    );
  }
});


const HomePage = React.createClass({
  render: function() {
    return (
      <div>
        {this.props.children}
      </div>
    );
  }
});

module.exports = {
  HomePage: HomePage,
  Calendar: Calendar,
  CalendarAppointment: CalendarAppointment,
  CalendarCustomer: CalendarCustomer,
  CalendarCustomerForm: CalendarCustomerForm,
  CalendarAppointments: CalendarAppointments
};