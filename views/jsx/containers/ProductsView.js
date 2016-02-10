import React from 'react';

import { fnFetchData } from './util';
import { ProductsViewUi } from "../components";


// The products main container used in the products section.
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
  deleteProduct: function(objId) {
    const that = this;
    $.ajax({
      url: '/products/' + objId,
      method: 'delete',
      complete: function(obj, status) {
        if (status === 'success') {
          that.updateTable();
        }
      }
    });
  },
  editProduct: function(objId) {
    this.context.router.push(`/products/edit/${objId}`);
  },
  cloneProduct: function(objId) {
    this.context.router.push(`/products/clone/${objId}`);
  },
  search: function(text) {
    this.setState({
      filterText: text
    });

    fnFetchData(this, '/products/search', text);
  },
  updateTable: function() {
    this.search(this.state.filterText);
  },
  render: function() {
    return (
      <ProductsViewUi
        loaded={this.state.loaded}
        data={this.state.data}
        deleteProduct={this.deleteProduct}
        editProduct={this.editProduct}
        cloneProduct={this.cloneProduct}
        search={this.search}
        newProductPath='/products/new'/>
    );
  }
});