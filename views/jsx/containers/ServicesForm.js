import React from 'react';

import { fnSubmitForm } from './util';
import { ServicesFormUi } from "../components";


// The services form container.
export default React.createClass({
  getInitialState: function() {
    return {
      items: [],
      errors: [],
      disabled: true,
      submitText: this.props.route.i18n.save,
      loaded: false
    };
  },
  componentWillMount: function() {
    $.ajax({
      url: '/settings/services',
      method: 'get',
      success: this.loadItems
    });
  },
  uuid4: function () {
    //// return uuid of form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    let uuid = '', ii;
    for (ii = 0; ii < 32; ii += 1) {
      switch (ii) {
      case 8:
      case 20:
        uuid += '-';
        uuid += (Math.random() * 16 | 0).toString(16);
        break;
      case 12:
        uuid += '-';
        uuid += '4';
        break;
      case 16:
        uuid += '-';
        uuid += (Math.random() * 4 | 8).toString(16);
        break;
      default:
        uuid += (Math.random() * 16 | 0).toString(16);
      }
    }
    return uuid;
  },
  addNewInput: function() {
    const items = this.state.items.slice();
    const obj = this.newEmptyObj();

    obj.id = this.uuid4();
    items.push(obj);

    this.setState({
      items: items
    });
  },
  removeInput: function(rowId) {
    const items = this.state.items.slice();
    let index;
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === rowId) {
        index = i;
        break;
      }
    }
    items.splice(index, 1);
    this.setState({
      items: items
    });
  },
  newEmptyObj: function() {
    return {
      name: ''
    };
  },
  loadItems: function(data) {
    // We need an unique and stable id so that React can perform
    // the reconciliation to understand who is the child removed
    // or added.
    const items = [];
    if (data.services.length === 0) {
      const emptyItem = this.newEmptyObj();
      emptyItem.id = this.uuid4();
      items[0] = emptyItem;
    }
    else {
      for (let i = 0; i < data.services.length; i++) {
        items[items.length] = {
          name: data.services[i],
          id: this.uuid4()
        };
      }
    }
    this.setState({
      items: items,
      loaded: true,
      disabled: true
    });
  },
  submit: function() {
    if (this.state.disabled) {
      this.setState({
        disabled: false
      });
      return;
    }

    const items = [];
    for (let i = 0; i < this.state.items.length; i++) {
      items[items.length] = this.state.items[i].name;
    }

    const data = {services: items};
    fnSubmitForm(this, '/settings/services', 'put', data, this.loadItems);
  },
  inputChange: function(inputId, text) {
    const items = this.state.items;

    for (let i = 0; i < items.length; i++) {
      if (items[i].id === inputId) {
        if (items[i].name === text) {
          return;
        }
        items[i].name = text;
        break;
      }
    }
    this.setState({
      items: items
    });
  },
  render: function() {
    return (
      <ServicesFormUi
        {...this.props}
        loaded={this.state.loaded}
        errors={this.state.errors}
        items={this.state.items}
        addNewInput={this.addNewInput}
        removeInput={this.removeInput}
        disabled={this.state.disabled}
        inputChange={this.inputChange}
        submit={this.submit} />
    );
  }
});