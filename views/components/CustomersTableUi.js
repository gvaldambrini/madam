import React from 'react';


// The customers table presentational component.
export default React.createClass({
  propTypes: {
    data: React.PropTypes.object.isRequired,
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
    const customerRows = this.props.data.customers.map(
      (customer, _index) =>
      <tr key={customer.id} onClick={
          function(event) {
            event.preventDefault();
            event.stopPropagation();
            that.props.editCustomer(customer.id);
          }
        }>
        <td dangerouslySetInnerHTML={this.renderHighlight(customer.name)} />
        <td dangerouslySetInnerHTML={this.renderHighlight(customer.surname)} />
        <td className="hidden-xs" dangerouslySetInnerHTML={this.renderHighlight(customer.phone)} />
        <td className="hidden-xs">{customer.last_seen}</td>
        <td className="no-padding">
          <span
            onClick={function(event) {event.stopPropagation();}}
            className="table-btn pull-right glyphicon glyphicon-trash"
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
            }></span>
        </td>
      </tr>
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