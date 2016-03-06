import React from 'react';
import { connect } from 'react-redux';

import { MainContentUi } from '../components';

import {
  fetchCustomerWithDetails,
  fetchCustomersWithDetails
} from '../redux/modules/customers';

import { fetchServicesIfNeeded } from '../redux/modules/services';


// The main content container (the whole page under authentication).
const MainContent = React.createClass({
  propTypes: {
    services: React.PropTypes.array.isRequired
  },
  componentDidMount: function() {
    this.props.dispatch(fetchServicesIfNeeded());
  },
  render: function() {
    return (
      <MainContentUi
        fetchCustomer={fetchCustomerWithDetails}
        fetchCustomers={fetchCustomersWithDetails}
        services={this.props.services}>
        {this.props.children}
      </MainContentUi>
    );
  }
});


function mapStateToProps(state) {
  const services = state.services;

  return {
    services: services.get('serviceList').toJS().map(el => el.name)
  };
}

export default connect(mapStateToProps)(MainContent);