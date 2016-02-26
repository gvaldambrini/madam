import React from 'react';
import { Link } from 'react-router';

import InputSearchUi from './InputSearchUi';
import PopoverTemplateUi from './PopoverTemplateUi';
import CustomersTableUi from './CustomersTableUi';


// The main customers presentational component, which includes the related table
// and the search input field.
export default React.createClass({
  propTypes: {
    loaded: React.PropTypes.bool.isRequired,
    customers: React.PropTypes.array.isRequired,
    search: React.PropTypes.func.isRequired,
    editCustomer: React.PropTypes.func.isRequired,
    deleteCustomer: React.PropTypes.func.isRequired,
    newCustomerPath: React.PropTypes.string.isRequired
  },
  render: function() {
    if (!this.props.loaded) {
      return <div></div>;
    }

    let customers;
    if (this.props.customers.length > 0) {
      customers = (
        <CustomersTableUi {...this.props} />
      );
    }
    else {
      customers = (
        <div className="alert alert-info" role="alert">
          {i18n.customers.emptyTableMsg}
        </div>
      );
    }

    return (
      <div>
        <div className="content-header">
          <Link to={this.props.newCustomerPath} className='btn btn-primary'>
            {i18n.customers.createNew}
          </Link>
          <InputSearchUi
            search={this.props.search}
            placeholder={i18n.customers.search}/>
        </div>
        <div id="customers-table-container" className="content-body">
          {customers}
        </div>
        <div id="popover-template">
          <PopoverTemplateUi
            confirm={i18n.customers.btnConfirm}
            cancel={i18n.customers.btnCancel}/>
        </div>
      </div>
    );
  }
});