import React from 'react';
import { Link, History } from 'react-router';

import moment from 'moment';

import { SimpleInput, FormInputDate, fnRenderErrors, fnSubmitForm } from './forms';
import { BaseTable, BaseTableContainer, PopoverTemplate } from './tables';


const AppointmentService = React.createClass({
  getInitialState: function() {
    return {
      description: '',
      worker: {},
      checked: false
    }
  },
  componentWillMount: function() {
    this.setState({
      description: this.props.data.description,
      worker: this.props.data.worker,
      checked: this.props.data.checked
    });
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({
      description: nextProps.data.description,
      worker: nextProps.data.worker,
      checked: nextProps.data.checked
    });
  },
  handleChange: function(event) {
    const target = event.currentTarget;
    const data = this.state;
    if (target.name ===  'service') {
      data.description = target.value;
    }
    else if (target.name ===  'enabled') {
      data.checked = target.checked;
    }
    this.props.updateService(this.props.index, data);
  },
  switchWorker: function(event) {
    // change the current worker to be the next one
    const $button = $(event.currentTarget);
    const $groupBtn = $button.closest('.input-group-btn');
    const $workers = $groupBtn.find('ul a');
    let newIndex = 0;
    for (var i = 0; i < $workers.length; i++) {
        if ($($workers[i]).text() == $button.text()) {
            newIndex = (i + 1) % $workers.length;
            break;
        }
    }
    const $newWorker = $($workers[newIndex]);
    const data = this.state;
    data.worker = {
      name: $newWorker.text(),
      color: $newWorker.css('color')
    };

    this.props.updateService(this.props.index, data);
  },
  selectWorker: function(event) {
    event.preventDefault();
    event.stopPropagation();

    // set the current worker from the selected one in the dropdown
    const $target = $(event.currentTarget);

    const data = this.state;
    data.worker = {
      name: $target.text(),
      color: $target.css('color')
    };

    this.props.updateService(this.props.index, data);
    $target.closest('ul').parent().find('.dropdown-toggle').dropdown('toggle');
  },
  render: function() {
    const that = this;
    const workers = this.props.workers.map(
      worker =>
      <li key={worker.name}>
        <a style={{color: worker.color}} href="#" ref={function(a) {
          // Probably due to a react.js bug, the standard onClick
          // method does not call the selectWorker when the click
          // is performed via javascript (using the console or
          // nightwatch).
          // The jQuery approach does not suffer this problem.
          $(a)
            .unbind('click', that.selectWorker)
            .on('click', that.selectWorker);
        }}>
          {worker.name}
        </a>
      </li>
    );

    return (
      <div className="form-group service">
        <div className="col-sm-12">
          <div className="input-group">
            <span className="input-group-addon">
              <input type="checkbox" name="enabled" value={this.props.index}
                checked={this.state.checked}
                onChange={this.handleChange}/>
            </span>
            <input type="text" className="form-control"
              value={this.state.description} name="service"
              onChange={this.handleChange}
              ref={
                // workaround needed to trigger the onChange handler (handleChange in this case)
                // from jQuery (which in turn needs to call the change() after the val('something'))
                // that is not the "normal" usage from a real user but is required to have tests
                // working.
                function(input) {
                  if (input != null) {
                    $(input)
                      .unbind('change', that.handleChange)
                      .change(that.handleChange);
                  }
                }
              }
              />
            <div className="input-group-btn">
              <button type="button" className="btn btn-default btn-click"
                style={{color: this.state.worker.color}} onClick={this.switchWorker}>
                {this.state.worker.name}
              </button>
              <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown">
                  <span className="caret"></span>
              </button>
              <ul className="dropdown-menu dropdown-menu-right" role="menu">
                {workers}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
});


const AppointmentTextArea = React.createClass({
  mixins: [SimpleInput],
  getInitialState: function() {
    return {value: ''}
  },
  componentWillMount: function() {
    this.setState({value: this.props.value});
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({value: nextProps.value});
  },
  render: function() {
    return (
      <div className="form-group">
        <div className="col-sm-12">
          <label className="control-label">{this.props.label}</label>
          <textarea name={this.props.name} className="form-control" rows="5"
            value={this.state.value}
            onChange={this.handleChange}>
          </textarea>
        </div>
      </div>
    );
  }
});


const AppointmentForm = React.createClass({
  render: function() {
    const services = this.props.services.map(
      (service, index) =>
      <AppointmentService index={index}
        data={service}
        updateService={this.props.updateService}
        workers={this.props.workers} key={index} />
    );
    return (
      <div className="content-body">
        {fnRenderErrors(this.props.errors)}
        <div className="form-container">
          <form id="form" className="form-horizontal customer" method="post">
            <div className="form-group">
              <h4 className="col-sm-12">{this.props.formTitle}</h4>
            </div>
            <FormInputDate name='date' value={this.props.date}
              label={i18n.appointments.date} handleChange={this.props.handleChange}/>
            {services}

            <div className="form-group">
                <div className="col-sm-12">
                    <button type="button" className="btn btn-default btn-add" onClick={this.props.addService}>
                      {i18n.appointments.addService}
                    </button>
                </div>
            </div>

            <AppointmentTextArea name='notes' value={this.props.notes}
              label={i18n.appointments.notes}
              handleChange={this.props.handleChange}/>

            <div className="form-group">
                <div className="col-sm-12">
                    <button type="button" className="btn btn-primary" name="submit" onClick={this.props.handleSubmit}>
                      {this.props.submitText}
                    </button>
                </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
});


const AppointmentFormContainer = React.createClass({
  propTypes: {
    editForm: React.PropTypes.bool.isRequired,
    urlData: React.PropTypes.string,
    submitText: React.PropTypes.string.isRequired,
    formTitle: React.PropTypes.string.isRequired,
    date: React.PropTypes.string,
    doSubmit: React.PropTypes.func.isRequired
  },
  getInitialState: function() {
    const date = typeof this.props.date !== 'undefined'
      ? moment(this.props.date).format(config.date_format)
      : moment().format(config.date_format)

    return {
      workers: undefined,
      services: undefined,
      date: date,
      notes: '',
      errors: []
    }
  },
  updateService: function(index, service) {
    const services = this.state.services;
    services[index] = service;
    this.setState({services: services});
  },
  handleChange: function(name, value) {
    if (name == 'date' && this.state.date !== value) {
      this.setState({date: value});
    }
    else if (name == 'notes' && this.state.notes !== value) {
      this.setState({notes: value});
    }
  },
  componentWillMount: function() {
    if (this.props.editForm) {
      $.ajax({
        url: this.props.urlData,
        method: 'get',
        success: this.loadAppointment
      });
    }
    else {
      $.ajax({
        url: '/settings/workers',
        method: 'get',
        success: this.loadWorkers
      });

      $.ajax({
        url: '/settings/services',
        method: 'get',
        success: this.loadServices
      });
    }
  },
  handleSubmit: function() {
    const services = [];
    for (let i = 0; i < this.state.services.length; i++) {
      services[services.length] = {
        description: this.state.services[i].description,
        enabled: this.state.services[i].checked,
        worker: this.state.services[i].worker.name
      }
    }
    const data = {
      services: services,
      date: this.state.date,
      notes: this.state.notes
    };

    this.props.doSubmit(this, data);
  },
  buildServiceMap: function(workers, services) {
    const map = [];
    // new appointment
    for (let i = 0; i < services.length; i++) {
      map.push({
        description: services[i],
        worker: workers[0],
        checked: false
      })
    }
    return map;
  },
  loadAppointment: function(data) {
    this.setState({
      workers: data.workers,
      services: data.services,
      date: data.date,
      notes: data.notes
    })
  },
  loadWorkers: function(data) {
    const newState = {};
    newState.workers = data.items;

    if (typeof this._services != 'undefined') {
      newState.services = this.buildServiceMap(data.items, this._services);
      this._services = undefined;
    }
    this.setState(newState);
  },
  loadServices: function(data) {
    if (typeof this.state.workers == 'undefined') {
      // a temporary variable which will be used later from the loadWorkers to
      // load the services map.
      this._services = data.items;
      return;
    }
    this.setState({
      services: this.buildServiceMap(this.state.workers, data.items)
    });
  },
  addService: function(event) {
    event.preventDefault();
    event.stopPropagation();
    const services = this.state.services.slice();
    services.push({
      checked: true,
      description: '',
      worker: this.state.workers[0]
    });

    this.setState({services: services});
  },
  render: function() {
    if (typeof this.state.workers == 'undefined' || typeof this.state.services == 'undefined') {
      return (<div></div>);
    }

    if (this.state.workers.length === 0) {
      return (
        <div id="appointment-view">
          <div className="alert alert-danger" role="alert">
            <Link to="/settings/workers">{i18n.appointments.setWorkersMsg}</Link>
          </div>
        </div>
      );
    }

    if (this.state.services.length === 0) {
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
        <AppointmentForm
          services={this.state.services}
          workers={this.state.workers}
          date={this.state.date}
          notes={this.state.notes}
          errors={this.state.errors}
          submitText={this.props.submitText}
          formTitle={this.props.formTitle}
          addService={this.addService}
          handleChange={this.handleChange}
          updateService={this.updateService}
          handleSubmit={this.handleSubmit}/>
      </div>
    );
  }
});


var Appointment = React.createClass({
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
      self,
      url,
      method,
      data,
      () => this.history.pushState(null, `/customers/edit/${this.props.params.id}/appointments`)
    );
  },
  render: function() {
    let submitText, formTitle, editForm, urlData, date;
    if (this.props.location.pathname.indexOf('planned') !== -1) {
      submitText = i18n.appointments.confirmAppointment;
      formTitle = i18n.appointments.titleConfirmAppointment;
      date = this.props.params.date;
      editForm = false;
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


const AppointmentsTable = React.createClass({
  mixins: [BaseTable],
  deleteItem: function(objId) {
    this.deleteRow(`/customers/${this.props.customer}/appointments/${objId}`);
  },
  render: function() {
    const that = this;
    const appointmentRows = this.props.data.map(function(app) {
      const appClass = app.planned ? 'planned-appointment' : '';
      const date = moment(app.date, config.date_format);
      return (
        <tr key={app.appid}
          className={date > moment() ? 'inactive' : ''}
          onClick={
            function(event) {
              event.preventDefault();
              event.stopPropagation();
              that.props.handleRowClick(app);
            }
          }>
          <td className={appClass}>{app.date}</td>
          <td className={appClass}>{app.planned ? i18n.appointments.planned : app.services}</td>
          <td className="no-padding">
            <span onClick={function(event) {event.stopPropagation();}} className="table-btn pull-right glyphicon glyphicon-trash"
              data-toggle="tooltip" data-placement="left" title={i18n.appointments.deleteText} ref={
                function(span) {
                  if (span != null) {
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
                      onConfirm: () => that.deleteItem(app.appid)
                    });
                  }
                }
              }></span>
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


const CustomerAppointments = React.createClass({
  mixins: [History],
  handleRowClick(app) {
    const date = moment(app.date, config.date_format);
    if (app.planned) {
      if (date > moment()) {
        return;
      }
      this.history.pushState(
        null, `/customers/edit/${this.props.customer}/appointments/planned/${date.format('YYYY-MM-DD')}/${app.appid}`);
    }
    else {
      this.history.pushState(
        null, `/customers/edit/${this.props.customer}/appointments/edit/${app.appid}`);
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


var Appointments = React.createClass({
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
      table = (
        <CustomerAppointments
          customer={this.props.params.id}
          data={this.state.data.appointments}
          updateTable={this.updateTable}/>
      );
    }

    return (
      <div className="content-body">
        <Link to={`/customers/edit/${this.props.params.id}/appointments/new`} className='btn btn-primary'>
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


const AppointmentsRoot = React.createClass({
  render: function() {
    return (
      <div className='content-body'>
        {this.props.children}
      </div>
    );
  }
});


module.exports = {
  AppointmentFormContainer: AppointmentFormContainer,
  AppointmentsTable: AppointmentsTable,
  Appointment: Appointment,
  Appointments: Appointments,
  AppointmentsRoot: AppointmentsRoot
}