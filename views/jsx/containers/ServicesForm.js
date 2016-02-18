import React from 'react';
import { connect } from 'react-redux';

import { List } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';

import {
  unlockServicesForm,
  resetServicesForm,
  fetchServicesIfNeeded,
  saveServices,
  addService,
  removeService,
  updateService
} from '../redux/actions';

import { ServicesFormUi } from "../components";


// The services form container.
const ServicesForm = React.createClass({
  propTypes: {
    loaded: React.PropTypes.bool.isRequired,
    items: ImmutablePropTypes.list.isRequired,
    errors: ImmutablePropTypes.list.isRequired,
    unlocked: React.PropTypes.bool.isRequired
  },
  componentDidMount: function() {
    this.props.dispatch(fetchServicesIfNeeded());
  },
  componentWillReceiveProps: function(_nextProps) {
    this.props.dispatch(fetchServicesIfNeeded());
  },
  componentWillUnmount: function() {
    this.props.dispatch(resetServicesForm());
  },
  submit: function() {
    this.props.dispatch(
      !this.props.unlocked
      ? unlockServicesForm()
      : saveServices(this.props.items));
  },
  render: function() {
    return (
      <ServicesFormUi
        {...this.props}
        loaded={this.props.loaded}
        errors={this.props.errors}
        items={this.props.items}
        disabled={!this.props.unlocked}
        addNewInput={this.props.addNewInput}
        removeInput={this.props.removeInput}
        inputChange={this.props.inputChange}
        submit={this.submit} />
    );
  }
});

function mapStateToProps(state) {
  const services = state.services;

  return {
    unlocked: services.get('unlocked'),
    loaded: services.get('loaded'),
    errors: services.get('errors'),
    items: services.get('items')
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatch,
    addNewInput: () => dispatch(addService()),
    removeInput: (inputId) => dispatch(removeService(inputId)),
    inputChange: (inputId, text) => dispatch(updateService(inputId, text))
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ServicesForm);
