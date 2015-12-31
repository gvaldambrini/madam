import React from 'react';
import { Link, History } from 'react-router';

import moment from 'moment';

import { SimpleInput, FormInputDate, fnRenderErrors, fnSubmitForm } from './forms';
import { BaseTable, BaseTableContainer, PopoverTemplate } from './tables';


var AppointmentService = React.createClass({
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
    var target = event.currentTarget;
    var data = this.state;
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
    var $button = $(event.currentTarget);
    var $groupBtn = $button.closest('.input-group-btn');
    var $workers = $groupBtn.find('ul a');
    var newIndex = 0;
    for (var i = 0; i < $workers.length; i++) {
        if ($($workers[i]).text() == $button.text()) {
            newIndex = (i + 1) % $workers.length;
            break;
        }
    }
    var $newWorker = $($workers[newIndex]);
    var data = this.state;
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
    var $target = $(event.currentTarget);

    var data = this.state;
    data.worker = {
      name: $target.text(),
      color: $target.css('color')
    };

    this.props.updateService(this.props.index, data);
    $target.closest('ul').parent().find('.dropdown-toggle').dropdown('toggle');
  },
  render: function() {
    var that = this;
    var workers = this.props.workers.map(function(worker) {
      var aStyle = {color: worker.color};
      return (
        <li key={worker.name}>
          <a style={aStyle} href="#" ref={function(a) {
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
    });

    var buttonStyle = {color: this.state.worker.color};
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
                style={buttonStyle} onClick={this.switchWorker}>
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


var AppointmentTextArea = React.createClass({
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


var AppointmentForm = React.createClass({
  render: function() {
    var that = this;
    var services = this.props.services.map(function(service, index) {
      return (
        <AppointmentService index={index}
          data={service}
          updateService={that.props.updateService}
          workers={that.props.workers} key={index} />
      );
    });
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


var Appointment = React.createClass({
  mixins: [History],
  getInitialState: function() {
    return {
      workers: undefined,
      services: undefined,
      date: moment().format(config.date_format),
      notes: '',
      errors: []
    }
  },
  updateService: function(index, service) {
    var services = this.state.services;
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
    var that = this;

    if (typeof this.props.params.appnum != 'undefined') {
      $.ajax({
        url: '/customers/' + this.props.params.id + '/appointments/' + this.props.params.appnum,
        method: 'get',
        success: that.loadAppointment
      });
    }
    else {
      $.ajax({
        url: '/settings/workers',
        method: 'get',
        success: that.loadWorkers
      });

      $.ajax({
        url: '/settings/services',
        method: 'get',
        success: that.loadServices
      });
    }
  },
  buildServiceMap: function(workers, services) {
    var map = [];
    // new appointment
    for (var i = 0; i < services.length; i++) {
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
    var newState = {};
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
    var services = this.state.services.slice();
    services.push({
      checked: true,
      description: '',
      worker: this.state.workers[0]
    });

    this.setState({services: services});
  },
  handleSubmit: function() {
    var that = this;
    var editForm = typeof this.props.params.appnum != 'undefined';
    var baseUrl = '/customers/' + this.props.params.id;

    var services = [];
    for (var i = 0; i < this.state.services.length; i++) {
      services[services.length] = {
        description: this.state.services[i].description,
        enabled: this.state.services[i].checked,
        worker: this.state.services[i].worker.name
      }
    }
    var data = {
      services: services,
      date: this.state.date,
      notes: this.state.notes
    };

    var url = baseUrl + (editForm ? '/appointments/' + this.props.params.appnum : '/appointments');
    var method = editForm ? 'put': 'post';
    var successCb = function() {
      that.history.pushState(null, '/customers/edit/' + that.props.params.id + '/appointments');
    };
    fnSubmitForm(this, url, method, data, successCb);
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

    var submitText, formTitle;
    if (typeof this.props.params.appnum != 'undefined') {
      submitText = i18n.appointments.submitEdit;
      formTitle = i18n.appointments.titleEdit;
    }
    else {
      submitText = i18n.appointments.submitAdd;
      formTitle = i18n.appointments.titleNew;
    }

    return (
      <div id="appointment-view">
        <AppointmentForm
          services={this.state.services}
          workers={this.state.workers}
          date={this.state.date}
          notes={this.state.notes}
          errors={this.state.errors}
          submitText={submitText}
          formTitle={formTitle}
          addService={this.addService}
          handleChange={this.handleChange}
          updateService={this.updateService}
          handleSubmit={this.handleSubmit}/>
      </div>
    );
  }
});


var AppointmentsTable = React.createClass({
  mixins: [BaseTable, History],
  deleteItem: function(objId) {
    this.deleteRow('/customers/' + this.props.customer + '/appointments/' + objId);
  },
  render: function() {
    var that = this;
    var appointmentRows = this.props.data.map(function(appointment) {
      return (
        <tr key={appointment.id} onClick={
            function(event) {
              that.history.pushState(
                null, '/customers/edit/' + that.props.customer + '/appointments/edit/' + appointment.id);
              event.preventDefault();
              event.stopPropagation();
            }
          }>
          <td>{appointment.date}</td>
          <td>{appointment.services}</td>
          <td className="no-padding">
            <span onClick={function(event) {event.stopPropagation();}} className="pull-right glyphicon glyphicon-trash"
              data-toggle="tooltip" data-placement="left"
              title={appointment.deleteText} data-obj-id={appointment.id} ref={
                function(span) {
                  if (span != null) {
                    var $span = $(span);
                    if ($span.data('tooltip-init'))
                      return;
                    $span.data('tooltip-init', true);
                    $span.tooltip();
                    $span.confirmPopover({
                      template: '#popover-template',
                      title: i18n.appointments.deleteTitle,
                      content: i18n.appointments.deleteMsg,
                      $rootContainer: $('#appointments-table-container'),
                      onConfirm: function() {
                        that.deleteItem($span.data('obj-id'));
                      }
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
              <th>{this.props.headerDate}</th>
              <th>{this.props.headerServices}</th>
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


var Appointments = React.createClass({
  mixins: [BaseTableContainer, History],
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
    this.fetchData('/customers/' + this.props.params.id + '/appointments');
  },
  render: function() {
    if (!this.state.loaded) {
      return <div></div>;
    }

    var table;
    if (this.state.data.length > 0) {
      table =  (
        <AppointmentsTable
          headerDate={i18n.appointments.date} headerServices={i18n.appointments.services}
          customer={this.props.params.id} data={this.state.data} updateTable={this.updateTable}/>
      );
    }

    return (
      <div className="content-body">
        <Link to={`/customers/edit/${this.props.params.id}/appointments/new`} className='btn btn-primary'>
          {i18n.appointments.createNew}
        </Link>
        {table}
        <div id="popover-template">
          <PopoverTemplate confirm={i18n.appointments.btnConfirm} cancel={i18n.appointments.btnCancel}/>
        </div>
      </div>
    );
  }
});


var AppointmentsRoot = React.createClass({
  render: function() {
    return (
      <div className='content-body'>
        {this.props.children}
      </div>
    );
  }
});


module.exports = {
  Appointment: Appointment,
  Appointments: Appointments,
  AppointmentsRoot: AppointmentsRoot
}