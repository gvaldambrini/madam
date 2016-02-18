import React from 'react';
import moment from 'moment';

import { fnSubmitForm } from './util';
import { AppointmentViewUi } from "../components";


// The base appointment container that contains the related form.
export default React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  propTypes: {
    destPath: React.PropTypes.string.isRequired
  },
  getInitialState: function() {
    const date = (typeof this.props.params.date !== 'undefined')
      ? moment(this.props.params.date)
      : moment();

    let submitText, formTitle, editForm, urlData;
    if (this.props.location.pathname.indexOf('planned') !== -1) {
      submitText = i18n.appointments.confirmAppointment;
      formTitle = i18n.appointments.titleConfirmAppointment;
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

    return {
      workers: undefined,
      services: undefined,
      date: date.format(config.date_format),
      notes: '',
      errors: [],
      staticData: {
        submitText: submitText,
        formTitle: formTitle,
        editForm: editForm,
        urlData: urlData
      }
    };
  },
  componentWillMount: function() {
    if (this.state.staticData.editForm) {
      $.ajax({
        url: this.state.staticData.urlData,
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
  buildServiceMap: function(workers, services) {
    const map = [];
    // new appointment
    for (let i = 0; i < services.length; i++) {
      map.push({
        description: services[i],
        worker: workers[0],
        checked: false
      });
    }
    return map;
  },
  loadAppointment: function(data) {
    function getColor(worker, workers) {
      for (let i = 0; i < workers.length; i++) {
        if (workers[i].name === worker) {
          return workers[i].color;
        }
      }
      return config.defaultWorkerColor;
    }

    let services = [];
    for (let i = 0; i < data.services.length; i++) {
      services[i] = {
        description: data.services[i].description,
        worker: {
          name: data.services[i].worker,
          color: getColor(data.services[i].worker, data.workers)
        },
        checked: true
      };
    }

    this.setState({
      workers: data.workers,
      services: services,
      date: data.date,
      notes: data.notes
    });
  },
  loadWorkers: function(data) {
    const newState = {};
    newState.workers = data.workers;

    if (typeof this._services !== 'undefined') {
      newState.services = this.buildServiceMap(data.workers, this._services);
      this._services = undefined;
    }
    this.setState(newState);
  },
  loadServices: function(data) {
    if (typeof this.state.workers === 'undefined') {
      // a temporary variable which will be used later from the loadWorkers to
      // load the services map.
      this._services = data.services;
      return;
    }
    this.setState({
      services: this.buildServiceMap(this.state.workers, data.services)
    });
  },
  updateService: function(index, service) {
    const services = this.state.services;
    services[index] = service;
    this.setState({services: services});
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
  inputChange: function(name, value) {
    if (name === 'date' && this.state.date !== value) {
      this.setState({date: value});
    }
    else if (name === 'notes' && this.state.notes !== value) {
      this.setState({notes: value});
    }
  },
  submit: function() {
    const services = [];
    for (let i = 0; i < this.state.services.length; i++) {
      services[services.length] = {
        description: this.state.services[i].description,
        enabled: this.state.services[i].checked,
        worker: this.state.services[i].worker.name
      };
    }
    const data = {
      services: services,
      date: this.state.date,
      notes: this.state.notes
    };

    let url;
    if (typeof this.props.params.appid !== 'undefined') {
      url = `/customers/${this.props.params.id}/appointments/${this.props.params.appid}`;
    }
    else {
      url = `/customers/${this.props.params.id}/appointments`;
    }

    fnSubmitForm(
      this,
      url,
      (typeof this.props.params.appid !== 'undefined') ? 'put': 'post',
      data,
      () => this.context.router.push(this.props.destPath)
    );
  },
  render: function() {
    return (
      <AppointmentViewUi
        services={this.state.services}
        workers={this.state.workers}
        date={this.state.date}
        notes={this.state.notes}
        errors={this.state.errors}
        submitText={this.state.staticData.submitText}
        formTitle={this.state.staticData.formTitle}
        addService={this.addService}
        inputChange={this.inputChange}
        updateService={this.updateService}
        submit={this.submit}/>
    );
  }
});