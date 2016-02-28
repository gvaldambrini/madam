import React from 'react';

import { login } from '../redux/modules/auth';
import { LoginFormUi } from '../components';


// The login form container.
const LoginForm = React.createClass({
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
  submit: function() {
    const that = this;
    const onSuccess = function(_obj) {
      that.context.router.push('/');
    };

    const onError = function(xhr, _textStatus, _errorThrown) {
      that.setState({
        errors: xhr.responseJSON.errors.map(item => item.msg)
      });
    };

    login(this.state.data.username, this.state.data.password).then(onSuccess, onError);
  },
  render: function() {
    return (
      <LoginFormUi
        errors={this.state.errors}
        data={this.state.data}
        inputChange={this.handleChange}
        submit={this.submit}
        />
    );
  }
});


export default LoginForm;