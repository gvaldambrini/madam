import React from 'react';

import { fnFetchData } from './util';
import { CustomersViewUi } from "../components";


// The customers main container used in the customers section.
export default React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  getInitialState: function() {
    return {
      data: {},
      loaded: false,
      filterText: ''
    };
  },
  componentWillMount: function() {
    this.updateTable();
  },
  deleteCustomer: function(objId) {
    const that = this;
    $.ajax({
      url: '/customers/' + objId,
      method: 'delete',
      complete: function(obj, status) {
        if (status === 'success') {
          that.updateTable();
        }
      }
    });
  },
  editCustomer: function(objId) {
    this.context.router.push(`/customers/edit/${objId}`);
  },
  search: function(text) {
    this.setState({
      filterText: text
    });

    fnFetchData(this, '/customers/search', text);
  },
  updateTable: function() {
    this.search(this.state.filterText);
  },
  render: function() {
    return (
      <CustomersViewUi
        loaded={this.state.loaded}
        data={this.state.data}
        deleteCustomer={this.deleteCustomer}
        editCustomer={this.editCustomer}
        search={this.search}
        newCustomerPath='/customers/new'/>
    );
  }
});