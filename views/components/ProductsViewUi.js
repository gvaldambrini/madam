import React from 'react';
import { Link } from 'react-router';

import InputSearchUi from './InputSearchUi';
import PopoverTemplateUi from './PopoverTemplateUi';
import ProductsTableUi from './ProductsTableUi';


// The main products presentational component, which includes the related table
// and the search input field.
export default React.createClass({
  propTypes: {
    loaded: React.PropTypes.bool.isRequired,
    products: React.PropTypes.array.isRequired,
    search: React.PropTypes.func.isRequired,
    editProduct: React.PropTypes.func.isRequired,
    cloneProduct: React.PropTypes.func.isRequired,
    deleteProduct: React.PropTypes.func.isRequired,
    newProductPath: React.PropTypes.string.isRequired
  },
  render: function() {
    let products;
    if (!this.props.loaded) {
      return <div></div>;
    }

    if (this.props.products.length > 0) {
      products = (
        <ProductsTableUi {...this.props}/>
      );
    }
    else {
      products = (
        <div className="alert alert-info" role="alert">
          {i18n.products.emptyTableMsg}
        </div>
      );
    }

    return (
      <div>
        <div className="content-header">
          <Link to={this.props.newProductPath} className='btn btn-primary'>
            {i18n.products.addNew}
          </Link>
          <InputSearchUi
            search={this.props.search}
            placeholder={i18n.products.search} />
        </div>
        <div id="products-table-container" className="content-body">
          {products}
        </div>
        <div id="popover-template">
          <PopoverTemplateUi
            confirm={i18n.products.btnConfirm}
            cancel={i18n.products.btnCancel}/>
        </div>
      </div>
    );
  }
});