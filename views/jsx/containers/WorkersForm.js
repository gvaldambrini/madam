import React from 'react';

import { fnSubmitForm } from './util';
import { WorkersFormUi } from "../components";


// The workers form container.
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
      url: '/settings/workers',
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
      name: '',
      color: config.defaultWorkerColor
    };
  },
  loadItems: function(data) {
    // We need an unique and stable id so that React can perform
    // the reconciliation to understand who is the child removed
    // or added.
    const items = [];
    if (data.workers.length === 0) {
      const emptyItem = this.newEmptyObj();
      emptyItem.id = this.uuid4();
      items[0] = emptyItem;
    }
    else {
      for (let i = 0; i < data.workers.length; i++) {
        items[items.length] = {
          name: data.workers[i].name,
          color: data.workers[i].color,
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

    const data = {workers: this.state.items};
    fnSubmitForm(this, '/settings/workers', 'put', data, this.loadItems);
  },
  inputChange: function(inputId, text, color) {
    const items = this.state.items;

    for (let i = 0; i < items.length; i++) {
      if (items[i].id === inputId) {
        if (items[i].name === text && items[i].color === color) {
          return;
        }
        items[i].name = text;
        items[i].color = color;
        break;
      }
    }
    this.setState({
      items: items
    });
  },
  render: function() {
    return (
      <WorkersFormUi
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

