const REQUEST_FETCH = 'services/REQUEST_FETCH';
const RESPONSE_FETCH = 'services/RESPONSE_FETCH';
const REQUEST_SAVE = 'services/REQUEST_SAVE';
const RESPONSE_SAVE = 'services/RESPONSE_SAVE';

const UNLOCK_FORM = 'services/UNLOCK_FORM';
const RESET_FORM = 'services/RESET_FORM';

const ADD_SERVICE = 'services/ADD_SERVICE';
const REMOVE_SERVICE = 'services/REMOVE_SERVICE';
const UPDATE_SERVICE = 'services/UPDATE_SERVICE';

import {
  List,
  Map
} from 'immutable';

import {
  prepareServices,
  parseErrors,
  parseServices,
  uuid4
} from '../util';


function findServiceIndex(services, serviceId) {
    let index;
    for (let i = 0; i < services.size; i++) {
      if (services.getIn([i, 'id']) === serviceId) {
        index = i;
        break;
      }
    }
    return index;
}

export default function reducer(state = Map({
  loaded: false,
  items: List(),
  savedItems: List(),
  errors: List(),
  unlocked: false
}), action) {
  switch (action.type) {
    case ADD_SERVICE:
      return state.updateIn(['items'], list => list.push(Map({name: '', id: uuid4()})));
    case REMOVE_SERVICE:
    {
      const index = findServiceIndex(state.get('items'), action.payload.serviceId);
      return state.updateIn(['items'], list => list.remove(index, 1));
    }
    case UPDATE_SERVICE:
    {
      const index = findServiceIndex(state.get('items'), action.payload.serviceId);
      return state.updateIn(['items', index, 'name'], _text => action.payload.text);
    }
    case UNLOCK_FORM:
      return state.set('unlocked', true);
    case RESET_FORM:
      return state.merge(
        Map({
          unlocked: false,
          items: List(state.get('savedItems')),
          errors: List()}));
    case RESPONSE_SAVE:
    case RESPONSE_FETCH:
      if (action.error) {
        return state.set('errors', parseErrors(action.payload));
      }
      const items = parseServices(action.payload);
      return state.merge(
        Map({
          loaded: true,
          items: items,
          savedItems: List(items),
          errors: List(),
          unlocked: false}));
    default:
      return state;
  }
}

function requestFetchServices() {
  return {
    type: REQUEST_FETCH
  };
}

function responseFetchServices(services) {
  return {
    type: RESPONSE_FETCH,
    payload: services,
    error: false
  };
}

function fetchServices() {
  return dispatch => {
    dispatch(requestFetchServices());
    $.ajax({
      url: '/settings/services',
      method: 'get',
      success: function(data) {
        dispatch(responseFetchServices(data.services));
      }
    });
  };
}

function shouldFetchServices(state) {
  const services = state.services;
  if (!services.get('loaded')) {
    return true;
  }
  return false;
}

export function fetchServicesIfNeeded() {
  return (dispatch, getState) => {
    if (shouldFetchServices(getState())) {
      return dispatch(fetchServices());
    }
  };
}

export function unlockServicesForm() {
  return {
    type: UNLOCK_FORM
  };
}

export function resetServicesForm() {
  return {
    type: RESET_FORM
  };
}

function requestSaveServices() {
  return {
    type: REQUEST_SAVE
  };
}

function responseSaveServices(services) {
  return {
    type: RESPONSE_SAVE,
    payload: services,
    error: false
  };
}

function responseSaveServicesError(errors) {
  return {
    type: RESPONSE_SAVE,
    payload: errors,
    error: true
  };
}

export function saveServices(services) {
  return dispatch => {
    dispatch(requestSaveServices());
    $.ajax({
      url: '/settings/services',
      method: 'put',
      contentType: 'application/json',
      data: JSON.stringify({services: prepareServices(services)}),
      success: function(data) {
        dispatch(responseSaveServices(data.services));
      },
      error: function(xhr, _textStatus, _errorThrown) {
        dispatch(responseSaveServicesError(xhr.responseJSON.errors));
      }
    });
  };
}

export function addService() {
  return {
    type: ADD_SERVICE
  };
}

export function removeService(serviceId) {
  return {
    type: REMOVE_SERVICE,
    payload: {
      serviceId
    }
  };
}

export function updateService(serviceId, text) {
  return {
    type: UPDATE_SERVICE,
    payload: {
      serviceId,
      text
    }
  };
}
