import React from 'react';
import ReactDOM from 'react-dom';

import CustomerSheetTemplateUi from './CustomerSheetTemplateUi';


export default React.createClass({
  print: function(_event, customer) {
    this.props.fetchCustomer(customer).then(function(data) {
      ReactDOM.render(
        <CustomerSheetTemplateUi data={data}/>,
        document.getElementById('print-container'));

      window.print();
    });
  },
  printMulti: function(_event, customers) {
    this.props.fetchCustomers(customers).then(function(data) {
      const sheets = data.map(function(obj, index) {
        return <CustomerSheetTemplateUi data={obj} key={index}/>;
      });
      ReactDOM.render(
        <div>{sheets}</div>,
        document.getElementById('print-container'));

      window.print();
    });
  },
  render: function() {
    const that = this;
    return (
      <div id='customer-sheet-printer' ref={
        function(div) {
          if (div !== null) {
            $(div)
              .unbind('print', that.print)
              .on('print', that.print);

            $(div)
              .unbind('print-multi', that.printMulti)
              .on('print-multi', that.printMulti);
          }
        }
      }>
      </div>
    );
  }
});
