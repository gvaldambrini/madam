import React from 'react';
import { History } from 'react-router';

import Cookies from 'js-cookie';

import { BaseForm, FormInput } from './forms';


var LoginForm = React.createClass({
  mixins: [BaseForm, History],
  getInitialState: function() {
    return {
      data: {
        username: '',
        password: ''
      },
      errors: []
    }
  },
  handleSubmit: function(event) {
    event.preventDefault();
    event.stopPropagation();

    var successCb = function(data) {
      Cookies.set('user', data.user);
      this.history.pushState(null, '/');
    };

    this.submitForm('/login', 'post', successCb);
  },
  render: function() {
    return (
      <div className="row col-sm-8 col-sm-offset-2">
        <div id="login-box">
          <h2 className="col-sm-offset-2">{i18n.login.boxTitle}</h2>
          {this.renderErrors()}
          <div id="form-container">
            <form id="form" className="form-horizontal login"
              method="post" action="/login">

              <FormInput type='text' name='username'
                label={i18n.login.username} focus={true} mandatory={true}
                value={this.state.data.username} handleChange={this.handleChange}/>

              <FormInput type='password' name='password'
                label={i18n.login.password} mandatory={true}
                value={this.state.data.password} handleChange={this.handleChange}/>

              <div className="form-group">
                <div className="col-sm-offset-2 col-sm-10">
                  <button type="submit" className="btn btn-primary" name="submit" onClick={this.handleSubmit}>
                    {i18n.login.submitText}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }
});

module.exports = {
  LoginForm: LoginForm
};
