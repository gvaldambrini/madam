import React from 'react';
import moment from 'moment';

import { fnSubmitForm } from './util';
import { ProductFormUi } from "../components";


// The product form container used in the products section.
export default React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  getInitialState: function() {
    return {
      data: {},
      errors: []
    };
  },
  componentWillMount: function() {
    const that = this;
    const cloneForm = this.props.route.path.startsWith('clone');
    if (this.props.params.id) {
      $.ajax({
        url: '/products/' + this.props.params.id,
        method: 'get',
        success: function(data) {
          if (cloneForm) {
            data.sold_date = moment().format(config.date_format);
            data.notes = '';
          }
          that.setState({
            data: data,
            errors: []
          });
        }
      });
    }
    else {
      that.setState({
        data: {
          sold_date: moment().format(config.date_format)
        },
        errors: []
      });
    }
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
    const editForm = this.props.route.path.startsWith('edit');
    const url = editForm ? `/products/${this.props.params.id}` : '/products';
    const method = editForm ? 'put': 'post';
    fnSubmitForm(this, url, method, this.state.data, _data => this.context.router.push('/products'));
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