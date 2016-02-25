const RESPONSE_FETCH = 'services/RESPONSE_FETCH';

import {
  List,
  Map,
  fromJS
} from 'immutable';


export default function reducer(state = Map({
  loaded: false,
  serviceList: List()
}), action) {
  switch (action.type) {
    case RESPONSE_FETCH:
      return state.merge(
        Map({
          loaded: true,
          serviceList: fromJS(action.payload.map(el => Map({name: el})))
        }));
    default:
      return state;
  }
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

export function saveServices(services) {
  return dispatch => {
    const ajaxPromise = $.ajax({
      url: '/settings/services',
      method: 'put',
      contentType: 'application/json',
      data: JSON.stringify({services: services.map(item => item.name)})
    });
    const onSuccess = function(data) {
      dispatch(responseFetchServices(fromJS(data.services)));
    };

    ajaxPromise.then(onSuccess);
    return ajaxPromise;
  };
}
