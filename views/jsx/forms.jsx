import React from 'react';

import Cookies from 'js-cookie';


var SimpleInput = {
  handleChange: function(event) {
    this.props.handleChange(this.props.name, event.currentTarget.value);
  }
};


var FormInputDate = React.createClass({
  propTypes: {
      handleChange: React.PropTypes.func.isRequired,
      name: React.PropTypes.string.isRequired,
      label: React.PropTypes.string.isRequired,
      value: React.PropTypes.string,
      orientation: React.PropTypes.oneOf(['top', 'bottom', 'left', 'right', 'auto'])
  },
  handleChange: function(event) {
    this.props.handleChange(this.props.name, $(event.currentTarget).val());
  },
  render: function() {
    var that = this;
    return (
      <div className="form-group">
        <label htmlFor={this.props.name} className="control-label col-sm-2">{this.props.label}</label>
        <div className="col-sm-10">
          <div className="input-group date" ref={
            function(div) {
              var $div = $(div);
              $div.datepicker({endDate: "0d"});
              $div.datepicker('setDate', that.props.value);
            }
          }>
            <input type="text" name={this.props.name}
              placeholder={config.date_format} className="form-control"
              ref={
                function(input) {
                  // the react onChange event is not fired from the datepicker, so let's
                  // use the standard event.
                  $(input)
                    .unbind('change', that.handleChange)
                    .change(that.handleChange);
                }
              }/>
            <span className="input-group-addon">
              <i className="glyphicon glyphicon-th"></i>
            </span>
          </div>
        </div>
      </div>
    );
  },
  componentWillMount: function() {
    if (typeof this.props.orientation !== 'undefined') {
      $.fn.datepicker.defaults.orientation = this.props.orientation;
    }
  }
});


var FormInput = React.createClass({
  mixins: [SimpleInput],
  propTypes: {
      handleChange: React.PropTypes.func.isRequired,
      name: React.PropTypes.string.isRequired,
      label: React.PropTypes.string.isRequired,
      value: React.PropTypes.string,
      type: React.PropTypes.string,
      focus: React.PropTypes.bool,
      mandatory: React.PropTypes.bool
  },
  getDefaultProps: function() {
    return {
      type: 'text'
    };
  },
  getInitialState: function() {
    return {value: ''}
  },
  componentWillMount: function() {
    this.setState({value: this.props.value});
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({value: nextProps.value});
  },
  render: function() {
    var mandatoryStar;
    if (this.props.mandatory) {
      mandatoryStar = <span className="mandatory">*</span>;
    }

    return (
      <div className="form-group">
        <label className="control-label col-sm-2" htmlFor={this.props.name}>
          {this.props.label}
          {mandatoryStar}
        </label>
        <div className="col-sm-10">
          <input className="form-control" type={this.props.type}
            name={this.props.name} placeholder={this.props.label}
            autoFocus={this.props.focus}
            value={this.state.value}
            onChange={this.handleChange}/>
        </div>
      </div>
    );
  }
});


var FormInputRadio = React.createClass({
  mixins: [SimpleInput],
  propTypes: {
      handleChange: React.PropTypes.func.isRequired,
      name: React.PropTypes.string.isRequired,
      label: React.PropTypes.string.isRequired,
      values: React.PropTypes.arrayOf(React.PropTypes.shape({
        name: React.PropTypes.string.isRequired,
        value: React.PropTypes.string.isRequired
      })).isRequired
  },
  getInitialState: function() {
    return {value: ''}
  },
  componentWillMount: function() {
    this.setState({value: this.props.value});
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({value: nextProps.value});
  },
  render: function() {
    var that = this;
    var radioValues = this.props.values.map(function(obj) {
      return (
        <label className="radio-inline" key={obj.value}>
          <input type="radio" name={that.props.name} value={obj.value}
          checked={that.state.value === obj.value}
          onChange={that.handleChange}/>
          {obj.name}
        </label>
      );
    });

    return (
      <div className="form-group">
        <label className="control-label col-sm-2" htmlFor={this.props.name}>
          {this.props.label}
        </label>
        <div className="col-sm-8">
          {radioValues}
        </div>
      </div>
    );
  }
});


var FormInputAndCheckbox = React.createClass({
  propTypes: {
      handleChange: React.PropTypes.func.isRequired,
      name: React.PropTypes.string.isRequired,
      cblabel: React.PropTypes.string.isRequired,
      cbname: React.PropTypes.string.isRequired,
      label: React.PropTypes.string.isRequired,
      value: React.PropTypes.string,
      cbvalue: React.PropTypes.bool,
      type: React.PropTypes.string
  },
  getInitialState: function() {
    return {
      value: '',
      cbvalue: false
    }
  },
  componentWillMount: function() {
    this.setState({
      value: this.props.value,
      cbvalue: this.props.cbvalue
    });
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({
      value: nextProps.value,
      cbvalue: nextProps.cbvalue
    });
  },
  handleChange: function(event) {
    var target = event.currentTarget;
    var value = target.type == "checkbox" ? target.checked : target.value;
    this.props.handleChange(target.name, value);
  },
  render: function() {
    return (
      <div className="form-group">
        <label className="control-label col-sm-2" htmlFor={this.props.name}>
          {this.props.label}
        </label>
        <div className="col-sm-10">
          <input className="form-control" type={this.props.type}
            name={this.props.name} placeholder={this.props.label}
            value={this.state.value}
            onChange={this.handleChange}/>
        </div>
        <div className="col-sm-offset-2 col-sm-10">
          <div className="checkbox">
            <label>
              <input type="checkbox" name={this.props.cbname}
              checked={this.state.cbvalue}
              onChange={this.handleChange}/>
              {this.props.cblabel}
            </label>
          </div>
        </div>
      </div>
    );
  }
});


var FormTextArea = React.createClass({
  mixins: [SimpleInput],
  propTypes: {
      handleChange: React.PropTypes.func.isRequired,
      name: React.PropTypes.string.isRequired,
      label: React.PropTypes.string.isRequired,
      value: React.PropTypes.string
  },
  getInitialState: function() {
    return {value: ''}
  },
  componentWillMount: function() {
    this.setState({value: this.props.value});
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({value: nextProps.value});
  },
  render: function() {
    return (
      <div className="form-group">
        <label className="control-label col-sm-2">{this.props.label}</label>
        <div className="col-sm-10">
          <textarea name={this.props.name} className="form-control" rows="5"
            value={this.state.value}
            onChange={this.handleChange}>
          </textarea>
        </div>
      </div>
    );
  }
});


function fnRenderErrors(errors) {
  var errors;
  if (errors.length > 0) {
    var errorMessages = errors.map(function(err) {
      return (<li key={err}>{err}</li>);
    });

    errors = (
      <div className="alert alert-danger">
        <ul>
          {errorMessages}
        </ul>
      </div>
    );
  }
  return errors;
}

function fnSubmitForm(self, url, method, data, successCb) {
  var that = self;

  $.ajax({
    url: url,
    method: method,
    headers: {
        'X-CSRF-Token': '{{csrftoken}}'
    },
    contentType: 'application/json',
    data: JSON.stringify(data),
    success: successCb.bind(self),
    error: function(xhr, textStatus, errorThrown) {
      if (xhr.status === 401) {
        Cookies.remove('user');
        that.history.pushState(null, '/login');
      }

      var errors = [];
      for (var i = 0; i < xhr.responseJSON.errors.length; i++) {
        errors[errors.length] = xhr.responseJSON.errors[i].msg;
      }
      that.setState({
        errors: errors
      });
    }

  });
}

var BaseForm = {
  handleChange: function(name, value) {
    var data = this.state.data;
    if (data[name] != value) {
      data[name] = value;

      this.setState({
        data: data
      });
    }
  },
  renderErrors: function() {
    return fnRenderErrors(this.state.errors);
  },
  submitForm: function(url, method, successCb) {
    fnSubmitForm(this, url, method, this.state.data, successCb);
  }
};


module.exports = {
  SimpleInput: SimpleInput,
  FormInputDate: FormInputDate,
  FormInput: FormInput,
  FormInputRadio: FormInputRadio,
  FormInputAndCheckbox: FormInputAndCheckbox,
  FormTextArea: FormTextArea,

  fnRenderErrors: fnRenderErrors,
  fnSubmitForm: fnSubmitForm,
  BaseForm: BaseForm
}




