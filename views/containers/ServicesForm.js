import React from 'react';
import { connect } from 'react-redux';

import {
  fetchServicesIfNeeded,
  saveServices
} from '../redux/modules/services';

import { ServicesFormUi } from '../components';


// The services form container.
const ServicesForm = React.createClass({
  propTypes: {
    serviceList: React.PropTypes.array.isRequired,
    loaded: React.PropTypes.bool.isRequired
  },
  getInitialState: function() {
    // The form local state is initialized from the one stored in redux
    // (if the related object already exists) and synced only on the save.
    let items = [];
    if (this.props.loaded) {
      items = this.prepareItems(this.props.serviceList);
    }

    return {
      items: items,
      errors: [],
      disabled: true
    };
  },
  componentDidMount: function() {
    if (!this.props.loaded) {
      this.props.dispatch(fetchServicesIfNeeded());
    }
  },
  componentWillReceiveProps: function(nextProps) {
    const items = this.prepareItems(nextProps.serviceList);
    this.setState({
      items: items,
      disabled: true
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
  removeInput: function(serviceId) {
    const items = this.state.items.slice();
    let index;
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === serviceId) {
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
  prepareItems: function(services) {
    const that = this;

    // We need an unique and stable id so that React can perform
    // the reconciliation to understand who is the child removed
    // or added.
    let items = [];
    if (services.length === 0) {
      const emptyItem = this.newEmptyObj();
      emptyItem.id = this.uuid4();
      items[0] = emptyItem;
    }
    else {
      items = services.map(function(item) { item.id = that.uuid4(); return item; });
    }
    return items;
  },
  submit: function() {
    const that = this;
    if (this.state.disabled) {
      this.setState({
        disabled: false
      });
      return;
    }

    const onError = function(xhr, _textStatus, _errorThrown) {
      that.setState({
        errors: xhr.responseJSON.errors.map(item => item.msg)
      });
    };

    this.props.dispatch(
      saveServices(this.state.items)
    ).then(undefined, onError);
  },
  inputChange: function(inputId, text) {
    const items = this.state.items.slice();

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
        loaded={this.props.loaded}
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

function mapStateToProps(state) {
  const services = state.services;

  return {
    serviceList: services.get('serviceList').toJS(),
    loaded: services.get('loaded')
  };
}

export default connect(mapStateToProps)(ServicesForm);
