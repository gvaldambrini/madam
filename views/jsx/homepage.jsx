import React from 'react';

import { History } from 'react-router';
import Autosuggest from 'react-autosuggest';

import Cookies from 'js-cookie';
import moment from 'moment';

import { BaseTableContainer } from './tables';
import { fnSubmitForm } from './forms';


var InputCustomer = React.createClass({
  mixins: [ History ],
  propTypes: {
    setCustomer: React.PropTypes.func.isRequired,
    getCustomer: React.PropTypes.func.isRequired
  },
  inputAttr: function() {
    return {
      placeholder: i18n.homepage.customerPlaceholder,
      className: 'form-control',
      onChange: this.onInputChanged,
      id: 'input-customer'
    };
  },
  onInputChanged: function(value) {
    if (this._suggestion_selected) {
      // Skip events generated from the suggestions.
      this._suggestion_selected = undefined;
      return;
    }

    this.props.setCustomer({
      fullname: value,
      id: undefined
    });
  },
  getSuggestions: function(input, callback) {
    var that = this;
    $.ajax({
      url: '/customers/simple-search',
      method: 'get',
      data: {text: input, size: 10},
      success: function(data) {
        callback(null, data.customers);
      },
      error: function(xhr, textStatus, errorThrown) {
        if (xhr.status === 401) {
          Cookies.remove('user');
          that.history.pushState(null, '/login');
        }
      }
    });
  },
  renderSuggestion: function(suggestion, input) {
    return suggestion.name + ' ' + suggestion.surname;
  },
  getSuggestionValue: function(suggestion) {
    return suggestion.name + ' ' + suggestion.surname;
  },
  onSuggestionSelected: function(suggestion, event) {
    event.preventDefault();
    this.props.setCustomer({
      fullname: this.getSuggestionValue(suggestion),
      id: suggestion.id
    });
    this._suggestion_selected = 1;
  },
  render: function() {
    return (
      <Autosuggest
        suggestions={this.getSuggestions}
        suggestionRenderer={this.renderSuggestion}
        onSuggestionSelected={this.onSuggestionSelected}
        suggestionValue={this.getSuggestionValue}
        inputAttributes={this.inputAttr()}
        value={this.props.getCustomer().fullname}
       />
    );
  }
});


var PlanAppointment = React.createClass({
  getInitialState: function() {
    return {
      customer: {
        fullname: '',
        id: undefined
      }
    }
  },
  getCustomer: function() {
    return this.state.customer;
  },
  setCustomer: function(customer) {
    this.setState({customer: customer});
  },
  handleSubmit: function(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.state.customer.fullname === '')
      return;

    this.props.plan(this.state.customer);
    this.setState({
      customer: {
        fullname: '',
        id: undefined
      }});
  },
  render: function() {
    return (
        <form className="form-horizontal col-sm-12">
          <label className="control-label col-sm-4" htmlFor='input-customer'>
            {i18n.homepage.planAppointment}
          </label>
          <div className="form-group input-group col-sm-8">
            <InputCustomer
              getCustomer={this.getCustomer}
              setCustomer={this.setCustomer}/>
            <span className="input-group-btn">
              <button type="button" className="btn btn-primary" name="submit" onClick={this.handleSubmit}>
                {i18n.homepage.plan}
              </button>
            </span>
          </div>
        </form>
    );
  }
});

var AppointmentsTable = React.createClass({
  render: function() {
    var that = this;
    var appointmentRows = this.props.appointments.map(function(app, index) {
      var content;
      if (app.planned) {
        content = <i style={{color: '#999'}}>({i18n.homepage.planned}) {app.fullname}</i>
      }
      else {
        content = app.fullname;
      }

      return (
        <tr key={that.props.date + app.fullname + app.planned}>
          <td>{content}</td>
          <td className="no-padding">
            <span onClick={function(event) {event.stopPropagation();}} className="pull-right glyphicon glyphicon-trash"
              data-toggle="tooltip" data-placement="left"
              title='delete'></span>
          </td>
        </tr>
      );
    });

    return (
      <table className='table table-hover'>
        <tbody>
        {appointmentRows}
        </tbody>
      </table>
    );
  }
});


var Calendar = React.createClass({
  mixins: [ BaseTableContainer, History ],
  getInitialState: function() {

    var date = typeof this.props.params.date !== 'undefined'
      ? this.props.params.date
      : moment().format('YYYY-MM-DD');

    return {
      date: date,
      data: [],
      loaded: false,
      errors: []
    }
  },
  componentWillMount: function() {
    this.updateTable();
  },
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.params.date !== this.state.date) {
      this.updateTable(nextProps.params.date);
      this.setState({date: moment(nextProps.params.date).format('YYYY-MM-DD')});
    }
  },
  updateTable: function(date) {
    this.fetchData('/customers/appointments/' + (typeof date === 'undefined' ? this.state.date : date));
  },
  addAppointment: function(customer) {
    var that = this;
    var data = {
      fullname: customer.fullname,
      id: customer.id
    };
    var url = '/customers/planned-appointments/' + this.state.date;
    fnSubmitForm(this, url, 'post', data, function(response) {
      var appointments = that.state.data.appointments;
      appointments.push({
        appid: response.id,
        fullname: data.fullname,
        id: data.id,
        planned: true
      });
      that.setState({data: {appointments: appointments}});
    });
  },
  setDate: function(date) {
    this.history.pushState(null, '/calendar/' + moment(date).format('YYYY-MM-DD'));
  },
  render: function() {
    var that = this;
    if (!this.state.loaded) {
      return <div></div>
    }

    var appointments;
    if (this.state.data.appointments.length > 0) {
      appointments = <AppointmentsTable appointments={this.state.data.appointments} date={this.state.date}/>;
    }

    return (
      <div>
        <div className='date-selector-header'>
          <span className="glyphicon glyphicon-menu-left" onClick={function(event) {
            var date = moment(that.state.date).subtract(1, 'days');
            that.setDate(date);
            var $dateSelector = $(event.currentTarget).closest('.date-selector-header').find('.date-selector');
            $dateSelector.datepicker('setDate', date.format(config.date_format));
          }}/>
          <span className="date-selector" data-provide="datepicker" ref={
            function(span) {
              $(span).datepicker().off('changeDate').on('changeDate', function(event) {
                that.setDate(moment(event.date.toISOString()));
              });
            }
          }>
            {moment(this.state.date).format(config.date_format)}
          </span>
          <span className="glyphicon glyphicon-menu-right" onClick={function(event) {
            var date = moment(that.state.date).add(1, 'days');
            that.setDate(date);
            var $dateSelector = $(event.currentTarget).closest('.date-selector-header').find('.date-selector');
            $dateSelector.datepicker('setDate', date.format(config.date_format));
          }}/>
        </div>
        <h4>{i18n.homepage.appointments}</h4>
        {appointments}
        <PlanAppointment plan={this.addAppointment}/>
      </div>
    );
  }
});


var HomePage = React.createClass({
  render: function() {
    return (
      <div className="content-body">
        {this.props.children}
      </div>
    );
  }
});

module.exports = {
  HomePage: HomePage,
  Calendar: Calendar
};