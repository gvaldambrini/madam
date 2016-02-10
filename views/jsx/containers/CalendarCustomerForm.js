import React from 'react';

import { fnSubmitForm } from './util';
import { CustomerFormUi } from "../components";


// The customer form container used in the calendar / homepage section.
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
    const that = this;
    const editForm = typeof this.props.params.id !== 'undefined';

    if (editForm) {
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
    else {
      $.ajax({
        url: `/customers/planned-appointments/${that.props.params.date}/${that.props.params.appid}`,
        method: 'get',
        success: function(data) {
          const name = data.fullname.split(' ', 1)[0];
          const surname = data.fullname.substr(name.length + 1);
          that.setState({
            data: {
              name: name,
              surname: surname
            },
            errors: []
          });
        }
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
    const editForm = typeof this.props.params.id !== 'undefined';
    const url = editForm ? '/customers/' + this.props.params.id : '/customers';
    const method = editForm ? 'put': 'post';
    const data = this.state.data;
    data.__appid = this.props.params.appid;

    fnSubmitForm(this, url, method, data, function(obj) {
      if (editForm) {
        that.context.router.push(`/calendar/${that.props.params.date}`);
      }
      else {
        that.context.router.push(
          `/calendar/${that.props.params.date}/customers/${obj.id}/appointments/planned/${that.props.params.appid}`);
      }
    });
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