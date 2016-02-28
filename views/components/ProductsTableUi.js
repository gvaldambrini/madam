import React from 'react';


// The products table presentational component.
export default React.createClass({
  propTypes: {
    products: React.PropTypes.array.isRequired,
    editProduct: React.PropTypes.func.isRequired,
    cloneProduct: React.PropTypes.func.isRequired,
    deleteProduct: React.PropTypes.func.isRequired
  },
  renderHighlight: function(element) {
    return {
      __html: element
    };
  },
  render: function() {
    const that = this;
    const productRows = this.props.products.map(function(product, index) {
      const productDetails = product.objects.map(function(object) {
        return (
          <tr key={object.id} onClick={
            function(event) {
              event.preventDefault();
              event.stopPropagation();
              that.props.editProduct(object.id);
            }
          }>
            <td>{object.date}</td>
            <td>{object.notes}</td>
            <td className="no-padding">
              <span className="table-btn-container">
                <span
                  onClick={function(event) {event.stopPropagation();}}
                  className="table-btn glyphicon glyphicon-trash"
                  data-toggle="tooltip" data-placement="left"
                  title={i18n.products.deleteText} ref={
                    function(span) {
                      if (span !== null) {
                        const $span = $(span);
                        if ($span.data('tooltip-init'))
                          return;
                        $span.data('tooltip-init', true);
                        $span.tooltip();
                        $span.confirmPopover({
                          template: '#popover-template',
                          title: i18n.products.deleteTitle,
                          content: i18n.products.deleteMsg,
                          $rootContainer: $('#products-table-container'),
                          onConfirm: () => that.props.deleteProduct(object.id)
                        });
                      }
                    }
                  }></span>
                </span>
            </td>
          </tr>
        );
      });

      return [
        <tr key={product.name + product.brand} data-toggle="collapse" data-target={'#expanded-row' + index}>
          <td dangerouslySetInnerHTML={that.renderHighlight(product.name)} />
          <td dangerouslySetInnerHTML={that.renderHighlight(product.brand)} />
          <td>{product.count}</td>
          <td className="no-padding">
            <span className="table-btn-container">
              <span className="table-btn glyphicon glyphicon-plus"
                data-toggle="tooltip" data-placement="left"
                title={i18n.products.cloneText}
                onClick={
                  function(event) {
                    event.preventDefault();
                    event.stopPropagation();
                    that.props.cloneProduct(product.objects[0].id);
                  }
                } ref={
                  function(span) {
                    if (span !== null) {
                      $(span).tooltip();
                    }
                  }
                }></span>
              </span>
          </td>
        </tr>,
        <tr>
          <td colSpan={4} className="hidden-row">
            <div id={'expanded-row' + index} className="collapse">
              <table className='table table-hover'>
                <thead data-toggle="collapse" data-target={'#expanded-row' + index}>
                  <tr>
                    <th>{i18n.products.soldDate}</th>
                    <th>{i18n.products.notes}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {productDetails}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      ];
    });

    return (
      <table className='table table-hover'>
        <thead>
          <tr>
            <th>{i18n.products.name}</th>
            <th>{i18n.products.brand}</th>
            <th>{i18n.products.soldCount}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {productRows}
        </tbody>
      </table>
    );
  }
});