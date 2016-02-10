import React from 'react';

import { fnSubmitForm } from './util';
import { CustomerFormUi } from "../components";


// The customer form container used in the customers section.
export default React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  getInitialState: function() {
    return {
      data: {},
      errors: []
    };
  },
  componentWillMount: function() {
    if (typeof this.props.params.id !== 'undefined') {
      $.ajax({
        url: `/customers/${this.props.params.id}`,
        method: 'get',
        success:
          data =>
          this.setState({
            data: data,
            errors: []
          })
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
    const editForm = typeof this.props.params.id !== 'undefined';
    const url = editForm ? `/customers/${this.props.params.id}` : '/customers';
    const method = editForm ? 'put': 'post';

    fnSubmitForm(this, url, method, this.state.data, function(obj) {
      if (submitAndAdd) {
        that.context.router.push(
          `/customers/edit/${obj.id}/appointments/new`);
      }
      else {
        that.context.router.push('/customers/');
      }
    });
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