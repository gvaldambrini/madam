export const REQUEST_FETCH_SERVICES = 'REQUEST_FETCH_SERVICES';
export const RESPONSE_FETCH_SERVICES = 'RESPONSE_FETCH_SERVICES';
export const REQUEST_SAVE_SERVICES = 'REQUEST_SAVE_SERVICES';
export const RESPONSE_SAVE_SERVICES = 'RESPONSE_SAVE_SERVICES';

export const UNLOCK_SERVICES_FORM = 'UNLOCK_SERVICES_FORM';
export const RESET_SERVICES_FORM = 'RESET_SERVICES_FORM';

export const ADD_SERVICE = 'ADD_SERVICE';
export const REMOVE_SERVICE = 'REMOVE_SERVICE';
export const UPDATE_SERVICE = 'UPDATE_SERVICE';

import { prepareServices } from '../util';


function requestFetchServices() {
  return {
    type: REQUEST_FETCH_SERVICES
  };
}

function responseFetchServices(services) {
  return {
    type: RESPONSE_FETCH_SERVICES,
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
  }
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
  }
}

export function unlockServicesForm() {
  return {
    type: UNLOCK_SERVICES_FORM
  };
}

export function resetServicesForm() {
  return {
    type: RESET_SERVICES_FORM
  };
}

function requestSaveServices() {
  return {
    type: REQUEST_SAVE_SERVICES
  };
}

function responseSaveServices(services) {
  return {
    type: RESPONSE_SAVE_SERVICES,
    payload: services,
    error: false
  };
}

function responseSaveServicesError(errors) {
  return {
    type: RESPONSE_SAVE_SERVICES,
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
  }
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
