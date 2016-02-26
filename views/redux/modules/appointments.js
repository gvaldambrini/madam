const RESPONSE_FETCH = 'appointments/RESPONSE_FETCH';
const APPOINTMENT_DELETED = 'appointments/APPOINTMENT_DELETED';
const RESPONSE_APPOINTMENT_FETCH = 'appointments/RESPONSE_APPOINTMENT_FETCH';

import moment from 'moment';
import {
  List,
  Map,
  fromJS
} from 'immutable';

import { fetchCustomers } from './customers';


function reducerPerCustomer(state = Map({
  name: '',
  surname: '',
  appointmentList: List(),
  appointmentObjects: Map()
}), action) {
  switch (action.type) {
    case RESPONSE_FETCH:
      return state.merge(
        Map({
          appointmentList: fromJS(action.payload.data.appointments),
          name: action.payload.data.name,
          surname: action.payload.data.surname
        })
      );
    case APPOINTMENT_DELETED:
    {
      const appointmentList = state
        .get('appointmentList')
        .filterNot(app => app.get('appid') === action.payload.appId);

      const appointmentObjects = state
        .get('appointmentObjects')
        .filterNot((v, k) => k === action.payload.appId);

      return state.merge(
        Map({
          appointmentList,
          appointmentObjects
        })
      );
    }
    case RESPONSE_APPOINTMENT_FETCH:
      return state.setIn(
        ['appointmentObjects', action.payload.appId],
        fromJS(action.payload.data));
    default:
      return state;
  }
}

export default function reducer(state = Map({
  customers: Map()
}), action) {
  switch (action.type) {
    case RESPONSE_FETCH:
    case APPOINTMENT_DELETED:
    case RESPONSE_APPOINTMENT_FETCH:
      return state.setIn(
        ['customers', action.payload.customerId],
        reducerPerCustomer(state.getIn(['customers', action.payload.customerId]), action));
    default:
      return state;
  }
}

function responseFetchAppointments(customerId, data) {
  return {
    type: RESPONSE_FETCH,
    payload: {
      customerId: customerId,
      data: data
    }
  };
}

function fetchAppointments(customerId) {
  return dispatch => {
    $.ajax({
      url: `/customers/${customerId}/appointments`,
      method: 'get',
      success: function(data) {
        dispatch(responseFetchAppointments(customerId, data));
      }
    });
  };
}

function shouldFetchAppointments(state, customerId) {
  const appointments = state.appointments;
  if (!appointments.hasIn(['customers', customerId])) {
    return true;
  }
  return false;
}

export function fetchAppointmentsIfNeeded(customerId) {
  return (dispatch, getState) => {
    if (shouldFetchAppointments(getState(), customerId)) {
      return dispatch(fetchAppointments(customerId));
    }
  };
}

function appointmentDeleted(customerId, appId) {
  return {
    type: APPOINTMENT_DELETED,
    payload: {
      customerId,
      appId
    }
  };
}

export function deleteAppointment(customerId, app) {
  let url;
  if (app.planned) {
    url = `/customers/planned-appointments/${moment(app.date, config.date_format).format('YYYY-MM-DD')}/${app.appid}`;
  }
  else {
    url = `/customers/${customerId}/appointments/${app.appid}`;
  }
  return dispatch => {
    $.ajax({
      url,
      method: 'delete',
      success: function() {
        dispatch(appointmentDeleted(customerId, app.appid));
      }
    });
  };
}

function responseFetchAppointment(customerId, appId, data) {
  return {
    type: RESPONSE_APPOINTMENT_FETCH,
    payload: {
      customerId: customerId,
      appId: appId,
      data: data
    }
  };
}

function fetchAppointment(customerId, appId) {
  return dispatch => {
    $.ajax({
      url: `/customers/${customerId}/appointments/${appId}`,
      method: 'get',
      success: function(data) {
        dispatch(responseFetchAppointment(customerId, appId, data));
      }
    });
  };
}

function shouldFetchAppointment(state, customerId, appId) {
  const appointments = state.appointments;
  if (!appointments.hasIn(['customers', customerId, 'appointmentObjects', appId])) {
    return true;
  }
  return false;
}

export function fetchAppointmentIfNeeded(customerId, appId) {
  return (dispatch, getState) => {
    if (shouldFetchAppointment(getState(), customerId, appId)) {
      return dispatch(fetchAppointment(customerId, appId));
    }
  };
}

export function saveAppointment(customerId, appId, data) {
  return dispatch => {
    let url, method;
    if (typeof appId !== 'undefined') {
      url = `/customers/${customerId}/appointments/${appId}`;
      method = 'put';
    }
    else {
      url = `/customers/${customerId}/appointments`;
      method = 'post';
    }
    const ajaxPromise = $.ajax({
      url,
      method,
      contentType: 'application/json',
      data: JSON.stringify(data)
    });
    const onSuccess = function(obj) {
      data.services = data.services.filter(item => item.enabled);
      // update the item on the objects list
      dispatch(responseFetchAppointment(customerId, obj.id, data));
      // let's refresh the appointment list and the customer ones
      // that displays the last seen data which can change when
      // saving an appointment.
      dispatch(fetchAppointments(customerId));
      dispatch(fetchCustomers(''));
    };

    ajaxPromise.then(onSuccess);
    return ajaxPromise;
  };
}
