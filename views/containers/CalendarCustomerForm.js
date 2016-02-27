import React from 'react';
import { connect } from 'react-redux';

import {
  fetchCustomer,
  saveCustomer
} from '../redux/modules/customers';

import { fetchAppointmentsByDateIfNeeded } from '../redux/modules/appointments';
import { CustomerFormUi } from '../components';


// The customer form container used in the calendar / homepage section.
const CalendarCustomerForm = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  propTypes: {
    customerObject: React.PropTypes.object
  },
  getInitialState: function() {
    // The form local state is initialized from the one stored in redux
    // (if the related object already exists) and synced only on the save.
    const data = typeof this.props.customerObject !== 'undefined'
      ? this.props.customerObject
      : {};

    return {
      data: data,
      errors: []
    };
  },
  componentDidMount: function() {
    if (typeof this.props.customerObject !== 'undefined') {
      return;
    }
    if (typeof this.props.params.id !== 'undefined') {
      this.props.dispatch(fetchCustomer(this.props.params.id));
    }
    else if (typeof this.props.params.date !== 'undefined') {
      this.props.dispatch(fetchAppointmentsByDateIfNeeded(this.props.params.date));
    }
  },
  componentWillReceiveProps: function(nextProps) {
    if (typeof nextProps.customerObject !== 'undefined') {
      this.setState({
        data: nextProps.customerObject
      });
    }
  },
  handleChange: function(name, value) {
    const data = this.state.data;
    if (data[name] !== value) {
      data[name] = value;

      this.setState({
        data: data
      });
    }
  },
  submit: function(_submitAndAdd) {
    const that = this;
    const data = this.state.data;
    data.__appid = this.props.params.appid;

    const onSuccess = function(obj) {
      const editForm = typeof that.props.params.id !== 'undefined';
      if (editForm) {
        that.context.router.push(`/calendar/${that.props.params.date}`);
      }
      else {
        that.context.router.push(
          `/calendar/${that.props.params.date}/customers/${obj.id}/appointments/planned/${that.props.params.appid}`);
      }
    };

    const onError = function(xhr, _textStatus, _errorThrown) {
      that.setState({
        errors: xhr.responseJSON.errors.map(item => item.msg)
      });
    };

    this.props.dispatch(
      saveCustomer(this.props.params.id, data)
    ).then(onSuccess, onError);
  },
  render: function() {
    const editForm = typeof this.props.params.id !== 'undefined';
    let submitText, formTitle;

    if (editForm) {
      submitText = i18n.homepage.submitEditCustomer;
      formTitle = i18n.homepage.editCustomer;
    }
    else {
      submitText = i18n.homepage.submitNewCustomer;
      formTitle = i18n.homepage.createNewCustomer;
    }

    return (
      <CustomerFormUi
        errors={this.state.errors}
        data={this.state.data}
        inputChange={this.handleChange}
        submit={this.submit}
        submitText={submitText}
        formTitle={formTitle}/>
    );
  }
});


function mapStateToProps(state, ownProps) {
  let obj;
  if (typeof ownProps.params.id !== 'undefined') {
    if (state.customers.get('customerObjects').has(ownProps.params.id)) {
      obj = state.customers.get('customerObjects').get(ownProps.params.id).toJS();
    }
  }
  else if (typeof ownProps.params.date !== 'undefined') {
    const apps = state.appointments.getIn(['dates', ownProps.params.date, 'appointmentList']);
    if (typeof apps !== 'undefined') {
      const objData = apps.filter(item => item.get('appid') === ownProps.params.appid).get(0).toJS();
      const name = objData.fullname.split(' ', 1)[0];
      obj = {
        name: name,
        surname: objData.fullname.substr(name.length + 1)
      };
    }
  }

  return {
    customerObject: obj
  };
}

export default connect(mapStateToProps)(CalendarCustomerForm);
