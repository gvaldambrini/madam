import React from 'react';


// The customers table presentational component.
export default React.createClass({
  propTypes: {
    customers: React.PropTypes.array.isRequired,
    editCustomer: React.PropTypes.func.isRequired,
    deleteCustomer: React.PropTypes.func.isRequired
  },
  renderHighlight: function(element) {
    return {
      __html: element
    };
  },
  render: function() {
    const that = this;
    const customerRows = this.props.customers.map(
      function(customer, _index) {
        return (
          <tr key={customer.id} onClick={
              function(event) {
                event.preventDefault();
                event.stopPropagation();
                that.props.editCustomer(customer.id);
              }
            }>
            <td dangerouslySetInnerHTML={that.renderHighlight(customer.name)} />
            <td dangerouslySetInnerHTML={that.renderHighlight(customer.surname)} />
            <td className="hidden-xs" dangerouslySetInnerHTML={that.renderHighlight(customer.phone)} />
            <td className="hidden-xs">{customer.last_seen}</td>
            <td className="no-padding">
              <span className="table-btn-container">
                <span
                  className="glyphicon glyphicon-print table-btn hidden-xs"
                  data-toggle="tooltip" data-placement="left"
                  title={i18n.customers.printCustomerSheet} ref={
                      function(span) {
                        if (span !== null) {
                          $(span).tooltip();
                        }
                      }
                  }
                  onClick={
                    function(event) {
                      event.preventDefault();
                      event.stopPropagation();
                      $('#customer-sheet-printer').trigger('print', [customer.id]);
                    }
                  }></span>
                <span
                  onClick={function(event) {event.stopPropagation();}}
                  className="table-btn glyphicon glyphicon-trash"
                  data-toggle="tooltip" data-placement="left" title={i18n.customers.deleteText} ref={
                    function(span) {
                      if (span !== null) {
                        const $span = $(span);
                        if ($span.data('tooltip-init'))
                          return;
                        $span.data('tooltip-init', true);
                        $span.tooltip();
                        $span.confirmPopover({
                          template: '#popover-template',
                          title: i18n.customers.deleteTitle,
                          content: i18n.customers.deleteMsg,
                          $rootContainer: $('#customers-table-container'),
                          onConfirm: () => that.props.deleteCustomer(customer.id)
                        });
                      }
                    }
                  }>
                </span>
              </span>
            </td>
          </tr>
        );
      }
    );

    return (
      <table className='table table-hover'>
        <thead>
          <tr>
            <th>{i18n.customers.name}</th>
            <th>{i18n.customers.surname}</th>
            <th className="hidden-xs">{i18n.customers.phones}</th>
            <th className="hidden-xs">{i18n.customers.lastSeen}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {customerRows}
        </tbody>
      </table>
    );
  }
});