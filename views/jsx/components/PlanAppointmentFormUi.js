import React from 'react';

import InputAutosuggestCustomerUi from './InputAutosuggestCustomerUi';


// The presentational component used to plan an appointment.
export default React.createClass({
  propTypes: {
    plan: React.PropTypes.func.isRequired,
    fetchCustomerSuggestions: React.PropTypes.func.isRequired
  },
  getInitialState: function() {
    return {
      customer: {
        fullname: '',
        id: undefined
      }
    };
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
          <InputAutosuggestCustomerUi
            getCustomer={this.getCustomer}
            setCustomer={this.setCustomer}
            fetchSuggestions={this.props.fetchCustomerSuggestions}/>
          <span className="input-group-btn">
            <button type="button" className="btn btn-primary" name="submit"
              onClick={this.handleSubmit}>
              {i18n.homepage.plan}
            </button>
          </span>
        </div>
      </form>
    );
  }
});