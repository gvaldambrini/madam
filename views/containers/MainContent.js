import React from 'react';

import { MainContentUi } from '../components';

import {
  fetchCustomerWithDetails,
  fetchCustomersWithDetails
} from '../redux/modules/customers';


// The main content container (the whole page under authentication).
const MainContent = React.createClass({
  render: function() {
    return (
      <MainContentUi
        fetchCustomer={fetchCustomerWithDetails}
        fetchCustomers={fetchCustomersWithDetails}>
        {this.props.children}
      </MainContentUi>
    );
  }
});


export default MainContent;
