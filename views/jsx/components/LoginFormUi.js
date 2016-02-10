import React from 'react';

import { fnRenderErrors } from './util';
import FormInputUi from './FormInputUi';


// The login form presentational component.
export default React.createClass({
  propTypes: {
    errors: React.PropTypes.array.isRequired,
    data: React.PropTypes.object.isRequired,
    inputChange: React.PropTypes.func.isRequired,
    submit: React.PropTypes.func.isRequired
  },
  handleSubmit: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.submit();
  },
  render: function() {
    return (
      <div className="row col-sm-8 col-sm-offset-2">
        <div id="login-box">
          <h2 className="col-sm-offset-2">{i18n.login.boxTitle}</h2>
          {fnRenderErrors(this.props.errors)}
          <div id="form-container">
            <form id="form" className="form-horizontal login"
              method="post" action="/login">

              <FormInputUi type='text' name='username'
                label={i18n.login.username} focus={true} mandatory={true}
                value={this.props.data.username} handleChange={this.props.inputChange}/>

              <FormInputUi type='password' name='password'
                label={i18n.login.password} mandatory={true}
                value={this.props.data.password} handleChange={this.props.inputChange}/>

              <div className="form-group">
                <div className="col-sm-offset-2 col-sm-10">
                  <button type="submit" className="btn btn-primary" name="submit"
                    onClick={this.handleSubmit}>
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