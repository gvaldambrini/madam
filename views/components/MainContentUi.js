import React from 'react';

import SidebarUi from './SidebarUi';
import CustomerSheetPrinterUi from './CustomerSheetPrinterUi';
import PopoverTemplateUi from './PopoverTemplateUi';


// The main content presentational component which includes the sidebar and displays
// the children.
export default React.createClass({
  render: function() {
    return (
      <div className="row">
        <SidebarUi/>
        <div className="col-sm-10 col-sm-offset-2 main">
          {this.props.children}
        </div>
        <CustomerSheetPrinterUi
          fetchCustomer={this.props.fetchCustomer}
          fetchCustomers={this.props.fetchCustomers}/>
        <div id="popover-template">
          <PopoverTemplateUi
            confirm={i18n.popover.btnConfirm}
            cancel={i18n.popover.btnCancel}/>
        </div>
      </div>
    );
  }
});