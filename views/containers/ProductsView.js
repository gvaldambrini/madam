import React from 'react';
import { connect } from 'react-redux';

import {
  fetchProductsIfNeeded,
  deleteProduct,
  resetProductsFilters
} from '../redux/modules/products';

import { ProductsViewUi } from '../components';


// The products main container used in the products section.
const ProductsView = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  propTypes: {
    loaded: React.PropTypes.bool.isRequired,
    filterText: React.PropTypes.string,
    products: React.PropTypes.array.isRequired
  },
  componentDidMount: function() {
    this.props.dispatch(fetchProductsIfNeeded(this.props.filterText));
  },
  componentWillReceiveProps: function(nextProps) {
    this.props.dispatch(fetchProductsIfNeeded(nextProps.filterText));
  },
  componentWillUnmount: function() {
    this.props.dispatch(resetProductsFilters());
  },
  editProduct: function(objId) {
    this.context.router.push(`/products/edit/${objId}`);
  },
  cloneProduct: function(objId) {
    this.context.router.push(`/products/clone/${objId}`);
  },
  render: function() {
    return (
      <ProductsViewUi
        {...this.props}
        editProduct={this.editProduct}
        cloneProduct={this.cloneProduct}
        newProductPath='/products/new'/>
    );
  }
});

function mapStateToProps(state) {
  const products = state.products;
  const loaded = typeof products.get('productList') !== 'undefined';
  return {
    loaded: loaded,
    filterText: products.get('filterText'),
    products: loaded ? products.get('productList').toJS() : []
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    search: text => dispatch(fetchProductsIfNeeded(text)),
    deleteProduct: productId => dispatch(deleteProduct(productId))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ProductsView);