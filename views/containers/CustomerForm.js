import React from 'react';
import { connect } from 'react-redux';

import { CustomerFormUi } from '../components';

import {
  fetchCustomer,
  saveCustomer
} from '../redux/modules/customers';


// The customer form container used in the customers section.
const CustomerForm = React.createClass({
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
    if (typeof this.props.params.id !== 'undefined' &&
        typeof this.props.customerObject === 'undefined') {
      this.props.dispatch(fetchCustomer(this.props.params.id));
    }
  },
  componentWillReceiveProps: function(nextProps) {
    if (typeof this.props.params.id !== 'undefined') {
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
  submit: function(submitAndAdd) {
    const that = this;
    const onSuccess = function(obj) {
      if (submitAndAdd) {
        that.context.router.push(
          `/customers/edit/${obj.id}/appointments/new`);
      }
      else {
        that.context.router.push('/customers/');
      }
    };

    const onError = function(xhr, _textStatus, _errorThrown) {
      that.setState({
        errors: xhr.responseJSON.errors.map(item => item.msg)
      });
    };

    this.props.dispatch(
      saveCustomer(this.props.params.id, this.state.data)
    ).then(onSuccess, onError);
  },
  render: function() {
    const editForm = typeof this.props.params.id !== 'undefined';
    let submitText, formTitle, submitAndAdd;

    if (editForm) {
      submitText = i18n.customers.submitEdit;
      formTitle = i18n.customers.edit;
    }
    else {
      submitText = i18n.customers.submitAdd;
      formTitle = i18n.customers.createNew;
      submitAndAdd = i18n.customers.submitAndAdd;
    }

    return (
      <CustomerFormUi
        errors={this.state.errors}
        data={this.state.data}
        inputChange={this.handleChange}
        submit={this.submit}
        submitText={submitText}
        submitAndAdd={submitAndAdd}
        formTitle={formTitle}/>
    );
  }
});


function mapStateToProps(state, ownProps) {
  const objects = state.customers.get('customerObjects');
  let obj;
  if (objects.has(ownProps.params.id)) {
    obj = objects.get(ownProps.params.id).toJS();
  }

  return {
    customerObject: obj
  };
}

export default connect(mapStateToProps)(CustomerForm);
