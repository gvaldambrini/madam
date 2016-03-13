import React from 'react';
import moment from 'moment';
import { connect } from 'react-redux';

import { fetchServicesIfNeeded } from '../redux/modules/services';
import { fetchWorkersIfNeeded } from '../redux/modules/workers';
import {
  fetchAppointmentIfNeeded,
  saveAppointment
} from '../redux/modules/appointments';

import { AppointmentViewUi } from '../components';


// The base appointment container that contains the related form.
const BaseAppointmentView = React.createClass({
  propTypes: {
    destPath: React.PropTypes.string.isRequired,
    workerList: React.PropTypes.array.isRequired,
    workersLoaded: React.PropTypes.bool.isRequired,
    serviceList: React.PropTypes.array.isRequired,
    servicesLoaded: React.PropTypes.bool.isRequired,
    appObject: React.PropTypes.object,
    params: React.PropTypes.shape({
      id: React.PropTypes.string.isRequired,
      appid: React.PropTypes.string,
      date: React.PropTypes.string
    }).isRequired
  },
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  getInitialState: function() {
    let data = {
      date: '',
      services: undefined,
      notes: ''
    };

    if (!this.isEditForm()) {
      if (this.props.workersLoaded && this.props.servicesLoaded) {
        data = this.prepareNewAppointment(
          this.props.serviceList, this.props.workerList);
      }
    }
    else {
      if (this.props.workersLoaded && typeof this.props.appObject !== 'undefined') {
        data = this.prepareExistingAppointment(
          this.props.appObject, this.props.workerList);
      }
    }

    return {
      data: data,
      errors: []
    };
  },
  componentDidMount: function() {
    if (!this.props.workersLoaded) {
      this.props.dispatch(fetchWorkersIfNeeded());
    }

    if (this.isEditForm()) {
      this.props.dispatch(
        fetchAppointmentIfNeeded(this.props.params.id, this.props.params.appid));
    }
    else {
      if (!this.props.servicesLoaded) {
        this.props.dispatch(fetchServicesIfNeeded());
      }
    }
  },
  componentWillReceiveProps: function(nextProps) {
    let data;
    if (!this.isEditForm()) {
      if (nextProps.workersLoaded && nextProps.servicesLoaded) {
        data = this.prepareNewAppointment(
          nextProps.serviceList, nextProps.workerList);
      }
    }
    else {
      if (nextProps.workersLoaded && typeof nextProps.appObject !== 'undefined') {
        data = this.prepareExistingAppointment(
          nextProps.appObject, nextProps.workerList);
      }
    }
    if (typeof data !== 'undefined') {
      this.setState({data: data});
    }
  },
  isEditForm: function() {
    if (this.props.route.path.indexOf('planned') === -1 &&
        typeof this.props.params.appid !== 'undefined') {
      return true;
    }
    return false;
  },
  prepareNewAppointment: function(services, workers) {
    const date = (typeof this.props.params.date !== 'undefined')
      ? moment(this.props.params.date)
      : moment();

    const data = {
      date: date.format(config.date_format),
      services: undefined,
      notes: ''
    };

    data.services = services.map(function(item) {
      return {
        description: item.name,
        worker: workers[0],
        checked: false
      };
    });
    return data;
  },
  prepareExistingAppointment: function(appObject, workers) {
    function getColor(worker) {
      for (let i = 0; i < workers.length; i++) {
        if (workers[i].name === worker) {
          return workers[i].color;
        }
      }
      return config.defaultWorkerColor;
    }

    const data = {
      date: appObject.date,
      services: undefined,
      notes: appObject.notes
    };

    data.services = appObject.services.map(function(item) {
      return {
        description: item.description,
        worker: {
          name: item.worker,
          color: getColor(item.worker)
        },
        checked: true
      };
    });
    return data;
  },
  updateService: function(index, service) {
    const data = this.state.data;
    const services = data.services.slice();
    services[index] = service;
    data.services = services;
    this.setState({
      data: data
    });
  },
  addService: function() {
    const data = this.state.data;
    const services = data.services.slice();
    services.push({
      checked: true,
      description: '',
      worker: this.props.workerList[0]
    });
    data.services = services;
    this.setState({
      data: data
    });
  },
  inputChange: function(name, value) {
    const data = this.state.data;
    if (name === 'date' && data.date !== value) {
      data.date = value;
      this.setState({
        data: data
      });
    }
    else if (name === 'notes' && data.notes !== value) {
      data.notes = value;
      this.setState({
        data: data
      });
    }
  },
  submit: function() {
    const services = this.state.data.services.map(function(item) {
      return {
        description: item.description,
        enabled: item.checked,
        worker: item.worker.name
      };
    });
    const data = {
      services: services,
      date: this.state.data.date,
      notes: this.state.data.notes
    };

    const that = this;
    const onSuccess = function(_data) {
      that.context.router.push(that.props.destPath);
    };

    const onError = function(xhr, _textStatus, _errorThrown) {
      that.setState({
        errors: xhr.responseJSON.errors.map(item => item.msg)
      });
    };

    this.props.dispatch(
      saveAppointment(this.props.params.id, this.props.params.appid, data)
    ).then(onSuccess, onError);
  },
  render: function() {
    let submitText, formTitle;
    if (this.props.route.path.indexOf('planned') !== -1) {
      submitText = i18n.appointments.confirmAppointment;
      formTitle = i18n.appointments.titleConfirmAppointment;
    }
    else if (typeof this.props.params.appid !== 'undefined') {
      submitText = i18n.appointments.submitEdit;
      formTitle = i18n.appointments.titleEdit;
    }
    else {
      submitText = i18n.appointments.submitAdd;
      formTitle = i18n.appointments.titleNew;
    }
    const loaded = (
      this.props.workersLoaded &&
      typeof this.state.data.services !== 'undefined');

    return (
      <AppointmentViewUi
        services={this.state.data.services}
        workers={this.props.workerList}
        loaded={loaded}
        date={this.state.data.date}
        notes={this.state.data.notes}
        errors={this.state.errors}
        submitText={submitText}
        formTitle={formTitle}
        addService={this.addService}
        inputChange={this.inputChange}
        updateService={this.updateService}
        submit={this.submit}/>
    );
  }
});


function mapStateToProps(state, ownProps) {
  let obj = state.appointments.getIn(
    ['customers', ownProps.params.id, 'appointmentObjects', ownProps.params.appid]);

  if (typeof obj !== 'undefined') {
    obj = obj.toJS();
  }

  return {
    serviceList: state.services.get('serviceList').toJS(),
    servicesLoaded: state.services.get('loaded'),
    workerList: state.workers.get('workerList').toJS(),
    workersLoaded: state.workers.get('loaded'),
    appObject: obj
  };
}

export default connect(mapStateToProps)(BaseAppointmentView);
