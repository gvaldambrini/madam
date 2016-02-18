import React from 'react';
import Cookies from 'js-cookie';

import { fnSubmitForm } from './util';
import { LoginFormUi } from "../components";


// The login form container.
export default React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  getInitialState: function() {
    return {
      data: {
        username: '',
        password: ''
      },
      errors: []
    };
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
  handleSubmit: function() {
    const that = this;
    fnSubmitForm(this, '/login', 'post', this.state.data, function(data) {
      Cookies.set('user', data.user);
      that.context.router.push('/');
    });
  },
  render: function() {
    return (
      <LoginFormUi
        errors={this.state.errors}
        data={this.state.data}
        inputChange={this.handleChange}
        submit={this.handleSubmit}
        />
    );
  }
});
