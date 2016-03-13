import React from 'react';
import moment from 'moment';
import { connect } from 'react-redux';

import { ProductFormUi } from '../components';

import {
  fetchProduct,
  saveProduct
} from '../redux/modules/products';


// The product form container used in the products section.
const ProductForm = React.createClass({
  propTypes: {
    productObject: React.PropTypes.object,
    params: React.PropTypes.shape({
      id: React.PropTypes.string
    }).isRequired
  },
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  getInitialState: function() {
    // The form local state is initialized from the one stored in redux
    // (if the related object already exists) and synced only on the save.
    let data = {};
    if (typeof this.props.params.id !== 'undefined') {
      if (typeof this.props.productObject !== 'undefined') {
        data = this.props.productObject;
      }
    }
    else {
      data = {
        sold_date: moment().format(config.date_format)
      };
    }

    return {
      data: data,
      errors: []
    };
  },
  componentDidMount: function() {
    if (typeof this.props.params.id !== 'undefined' &&
        typeof this.props.productObject === 'undefined') {
      this.props.dispatch(fetchProduct(this.props.params.id));
    }
  },
  componentWillReceiveProps: function(nextProps) {
    if (typeof this.props.params.id !== 'undefined') {
      this.updateFormData(nextProps.productObject);
    }
  },
  updateFormData: function(data) {
    const cloneForm = this.props.route.path.startsWith('clone');
    if (cloneForm) {
      data.sold_date = moment().format(config.date_format);
      data.notes = '';
    }
    else {
      // If the data in the state contains the id it means that we are
      // editing an existing product.
      data.id = this.props.params.id;
    }

    this.setState({
      data: data
    });
  },
  handleChange: function(name, value) {
    const data = this.state.data;
    if (data[name] !== value) {
      data[name] = value;

      this.setState({
        data: data
      });
    }
  },
  submit: function() {
    const that = this;
    const onSuccess = function(_data) {
      that.context.router.push('/products');
    };

    const onError = function(xhr, _textStatus, _errorThrown) {
      that.setState({
        errors: xhr.responseJSON.errors.map(item => item.msg)
      });
    };

    this.props.dispatch(
      saveProduct(this.state.data.id, this.state.data)
    ).then(onSuccess, onError);
  },
  render: function() {
    const editForm = this.props.route.path.startsWith('edit');
    let submitText, formTitle;
    if (editForm) {
      submitText = i18n.products.submitEdit;
      formTitle = i18n.products.edit;
    }
    else {
      submitText = i18n.products.submitAdd;
      formTitle = i18n.products.addNew;
    }

    return (
      <ProductFormUi
        errors={this.state.errors}
        data={this.state.data}
        inputChange={this.handleChange}
        submit={this.submit}
        submitText={submitText}
        formTitle={formTitle}/>
    );
  }
});


function mapStateToProps(state, ownProps) {
  const objects = state.products.get('productObjects');
  let obj;
  if (objects.has(ownProps.params.id)) {
    obj = objects.get(ownProps.params.id).toJS();
  }

  return {
    productObject: obj
  };
}

export default connect(mapStateToProps)(ProductForm);
