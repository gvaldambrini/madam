import React from 'react';
import { connect } from 'react-redux';

import {
  fetchWorkersIfNeeded,
  saveWorkers
} from '../redux/modules/workers';

import { WorkersFormUi } from '../components';


// The workers form container.
const WorkersForm = React.createClass({
  propTypes: {
    workerList: React.PropTypes.array.isRequired,
    loaded: React.PropTypes.bool.isRequired
  },
  getInitialState: function() {
    // The form local state is initialized from the one stored in redux
    // (if the related object already exists) and synced only on the save.
    let items = [];
    if (this.props.loaded) {
      items = this.prepareItems(this.props.workerList);
    }

    return {
      items: items,
      errors: [],
      disabled: true
    };
  },
  componentDidMount: function() {
    if (!this.props.loaded) {
      this.props.dispatch(fetchWorkersIfNeeded());
    }
  },
  componentWillReceiveProps: function(nextProps) {
    const items = this.prepareItems(nextProps.workerList);
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
  removeInput: function(workerId) {
    const items = this.state.items.slice();
    let index;
    for (let i = 0; i < items.length; i++) {
      if (items[i].id === workerId) {
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
  prepareItems: function(workers) {
    const that = this;
    // We need an unique and stable id so that React can perform
    // the reconciliation to understand who is the child removed
    // or added.
    let items = [];
    if (workers.length === 0) {
      const emptyItem = this.newEmptyObj();
      emptyItem.id = this.uuid4();
      items[0] = emptyItem;
    }
    else {
      items = workers.map(function(item) { item.id = that.uuid4(); return item; });
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
      saveWorkers(this.state.items)
    ).then(undefined, onError);
  },
  inputChange: function(inputId, text, color) {
    const items = this.state.items.slice();

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
  const workers = state.workers;
  return {
    workerList: workers.get('workerList').toJS(),
    loaded: workers.get('loaded')
  };
}

export default connect(mapStateToProps)(WorkersForm);
