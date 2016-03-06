import React from 'react';

import SidebarUi from './SidebarUi';
import CustomerSheetPrinterUi from './CustomerSheetPrinterUi';
import PopoverTemplateUi from './PopoverTemplateUi';


// The main content presentational component which includes the sidebar and displays
// the children.
export default React.createClass({
  propTypes: {
    services: React.PropTypes.array.isRequired,
    fetchCustomer: React.PropTypes.func.isRequired,
    fetchCustomers: React.PropTypes.func.isRequired
  },
  render: function() {
    return (
      <div className="row">
        <SidebarUi/>
        <div className="col-sm-10 col-sm-offset-2 main">
          {this.props.children}
        </div>
        <CustomerSheetPrinterUi {...this.props}/>
        <div id="popover-template">
          <PopoverTemplateUi
            confirm={i18n.popover.btnConfirm}
            cancel={i18n.popover.btnCancel}/>
        </div>
      </div>
    );
  }
});