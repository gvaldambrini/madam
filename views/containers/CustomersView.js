import React from 'react';
import { connect } from 'react-redux';

import {
  fetchCustomersIfNeeded,
  deleteCustomer,
  resetCustomersFilters
} from '../redux/modules/customers';

import { CustomersViewUi } from '../components';


// The customers main container used in the customers section.
const CustomersView = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  propTypes: {
    loaded: React.PropTypes.bool.isRequired,
    filterText: React.PropTypes.string,
    customers: React.PropTypes.array.isRequired
  },
  componentDidMount: function() {
    this.props.dispatch(fetchCustomersIfNeeded(this.props.filterText));
  },
  componentWillReceiveProps: function(nextProps) {
    this.props.dispatch(fetchCustomersIfNeeded(nextProps.filterText));
  },
  componentWillUnmount: function() {
    this.props.dispatch(resetCustomersFilters());
  },
  editCustomer: function(objId) {
    this.context.router.push(`/customers/edit/${objId}`);
  },
  render: function() {
    return (
      <CustomersViewUi
        {...this.props}
        editCustomer={this.editCustomer}
        newCustomerPath='/customers/new'/>
    );
  }
});

function mapStateToProps(state) {
  const customers = state.customers;

  return {
    loaded: customers.get('loaded'),
    filterText: customers.get('filterText'),
    customers: customers.get('customerList').toJS()
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    search: text => dispatch(fetchCustomersIfNeeded(text)),
    deleteCustomer: customerId => dispatch(deleteCustomer(customerId))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CustomersView);