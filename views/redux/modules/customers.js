const REQUEST_FETCH = 'customers/REQUEST_FETCH';
const RESPONSE_FETCH = 'customers/RESPONSE_FETCH';
const RESET_FILTER = 'customers/RESET_FILTER';

const CUSTOMER_DELETED = 'customers/CUSTOMER_DELETED';
const CUSTOMER_FETCHED = 'customers/CUSTOMER_FETCHED';

import {
  List,
  Map,
  fromJS
} from 'immutable';


export default function reducer(state = Map({
  loaded: false,
  filterText: '',
  customerList: List(),
  customerObjects: Map()
}), action) {
  switch (action.type) {
    case REQUEST_FETCH:
      return state.set('filterText', action.payload);
    case RESET_FILTER:
      return state.set('filterText', '');
    case CUSTOMER_DELETED:
    {
      const customerList = state
        .get('customerList')
        .filterNot(customer => customer.get('id') === action.payload);

      const customerObjects = state
        .get('customerObjects')
        .filterNot((v, k) => k === action.payload);

      return state.merge(
        Map({
          customerList,
          customerObjects
        })
      );
    }
    case RESPONSE_FETCH:
      return state.merge(
        Map({
          loaded: true,
          customerList: fromJS(action.payload)}));
    case CUSTOMER_FETCHED:
      return state.setIn(
        ['customerObjects', action.payload.customerId], fromJS(action.payload.data));
    default:
      return state;
  }
}

function requestFetchCustomers(filterText) {
  return {
    type: REQUEST_FETCH,
    payload: filterText
  };
}

function responseFetchCustomers(customers) {
  return {
    type: RESPONSE_FETCH,
    payload: customers
  };
}

export function fetchCustomers(filterText) {
  return dispatch => {
    dispatch(requestFetchCustomers(filterText));
    $.ajax({
      url: '/customers/search',
      method: 'get',
      data: {text: filterText},
      success: function(data) {
        dispatch(responseFetchCustomers(data.customers));
      }
    });
  };
}

function shouldFetchCustomers(state, filterText) {
  const customers = state.customers;
  if (customers.get('filterText') !== filterText) {
    return true;
  }
  if (!customers.get('loaded')) {
    return true;
  }
  return false;
}

export function fetchCustomersIfNeeded(filterText) {
  return (dispatch, getState) => {
    if (shouldFetchCustomers(getState(), filterText)) {
      return dispatch(fetchCustomers(filterText));
    }
  };
}

export function searchCustomers(text) {
  // This function does not produce any modification in the
  // global state tree. However is here as it is related to
  // the customers and performs an AJAX call.
  return $.ajax({
    url: '/customers/simple-search',
    method: 'get',
    data: {text: text, size: 10}
  });
}

function customerDeleted(customerId) {
  return {
    type: CUSTOMER_DELETED,
    payload: customerId
  };
}

export function deleteCustomer(customerId) {
  return dispatch => {
    $.ajax({
      url: '/customers/' + customerId,
      method: 'delete',
      success: function() {
        dispatch(customerDeleted(customerId));
      }
    });
  };
}

function resetFilterText() {
  return {
    type: RESET_FILTER
  };
}

export function resetCustomersFilters() {
  return (dispatch, getState) => {
    const customers = getState().customers;
    if (customers.get('filterText') === '') {
      return;
    }
    dispatch(resetFilterText());
    dispatch(fetchCustomers(''));
  };
}

function responseFetchCustomer(customerId, data) {
  return {
    type: CUSTOMER_FETCHED,
    payload: {
      customerId: customerId,
      data: data
    }
  };
}

export function fetchCustomerWithDetails(customerId) {
  return $.ajax({
    url: `/customers/${customerId}/details`,
    method: 'get'
  });
}

export function fetchCustomersWithDetails(customerIds) {
  return $.ajax({
    url: '/customers/details',
    method: 'get',
    data: {ids: customerIds.join(',')}
  });
}

export function fetchCustomer(customerId) {
  return dispatch => {
    const ajaxPromise = $.ajax({
      url: '/customers/' + customerId,
      method: 'get'
    });
    ajaxPromise.then((data) => dispatch(responseFetchCustomer(customerId, data)));
    return ajaxPromise;
  };
}

export function saveCustomer(customerId, data) {
  return dispatch => {
    let url, method;
    if (typeof customerId === 'undefined') {
      url = '/customers';
      method = 'post';
    }
    else {
      url = `/customers/${customerId}`;
      method = 'put';
    }
    const ajaxPromise = $.ajax({
      url,
      method,
      contentType: 'application/json',
      data: JSON.stringify(data)
    });
    const onSuccess = function(obj) {
      // update the item on the objects list
      dispatch(responseFetchCustomer(obj.id, data));
      // let's refresh the customer list
      dispatch(fetchCustomers(''));
    };

    ajaxPromise.then(onSuccess);
    return ajaxPromise;
  };
}
