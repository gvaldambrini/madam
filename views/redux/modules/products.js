const REQUEST_FETCH = 'products/REQUEST_FETCH';
const RESPONSE_FETCH = 'products/RESPONSE_FETCH';
const RESET_FILTER = 'products/RESET_FILTER';
const INVALIDATE = 'products/INVALIDATE';

const PRODUCT_DELETED = 'products/PRODUCT_DELETED';
const PRODUCT_FETCHED = 'products/PRODUCT_FETCHED';

import {
  Map,
  fromJS
} from 'immutable';


export default function reducer(state = Map({
  filterText: '',
  productList: undefined,
  fetching: false,
  productObjects: Map()
}), action) {
  switch (action.type) {
  case REQUEST_FETCH:
    return state.merge(Map({
      filterText: action.payload,
      fetching: true}));
  case RESET_FILTER:
    return state.set('filterText', '');
  case PRODUCT_DELETED:
    {
      const products = state.get('productList');
      for (let i = 0; i < products.size; i++) {
        const objects = products.getIn([i, 'objects']);
        for (let j = 0; j < objects.size; j++) {
          if (objects.getIn([j, 'id']) === action.payload) {
            if (objects.size > 1) {
              return state
                .deleteIn(['productList', i, 'objects', j])
                .updateIn(['productList', i, 'count'], num => num - 1);
            }
            return state.deleteIn(['productList', i]);
          }
        }
      }

      return state;
    }
  case RESPONSE_FETCH:
    return state.merge(
      Map({
        productList: fromJS(action.payload),
        fetching: false}));
  case INVALIDATE:
    return state.merge(
      Map({
        productList: undefined,
        fetching: false}));
  case PRODUCT_FETCHED:
    return state.setIn(
        ['productObjects', action.payload.productId], fromJS(action.payload.data));
  default:
    return state;
  }
}

function requestFetchProducts(filterText) {
  return {
    type: REQUEST_FETCH,
    payload: filterText
  };
}

function responseFetchProducts(products) {
  return {
    type: RESPONSE_FETCH,
    payload: products
  };
}

function fetchProducts(filterText) {
  return dispatch => {
    dispatch(requestFetchProducts(filterText));
    $.ajax({
      url: '/products/search',
      method: 'get',
      data: {text: filterText},
      success: function(data) {
        dispatch(responseFetchProducts(data.products));
      }
    });
  };
}

function shouldFetchProducts(state, filterText) {
  const products = state.products;
  if (products.get('filterText') !== filterText) {
    return true;
  }
  if (typeof products.get('productList') === 'undefined' &&
      products.get('fetching') !== true) {
    return true;
  }
  return false;
}

export function fetchProductsIfNeeded(filterText) {
  return (dispatch, getState) => {
    if (shouldFetchProducts(getState(), filterText)) {
      return dispatch(fetchProducts(filterText));
    }
  };
}

function invalidateProducts() {
  return {
    type: INVALIDATE
  };
}

function productDeleted(productId) {
  return {
    type: PRODUCT_DELETED,
    payload: productId
  };
}

export function deleteProduct(productId) {
  return dispatch => {
    $.ajax({
      url: '/products/' + productId,
      method: 'delete',
      success: function() {
        dispatch(productDeleted(productId));
      }
    });
  };
}

function resetFilterText() {
  return {
    type: RESET_FILTER
  };
}

export function resetProductsFilters() {
  return (dispatch, getState) => {
    const products = getState().products;
    if (products.get('filterText') === '') {
      return;
    }
    dispatch(resetFilterText());
    dispatch(fetchProducts(''));
  };
}

function responseFetchProduct(productId, data) {
  return {
    type: PRODUCT_FETCHED,
    payload: {
      productId: productId,
      data: data
    }
  };
}

export function fetchProduct(productId) {
  return dispatch => {
    $.ajax({
      url: '/products/' + productId,
      method: 'get',
      success: function(data) {
        dispatch(responseFetchProduct(productId, data));
      }
    });
  };
}

export function saveProduct(productId, data) {
  return dispatch => {
    let url, method;
    if (typeof productId === 'undefined') {
      url = '/products';
      method = 'post';
    }
    else {
      url = `/products/${productId}`;
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
      dispatch(responseFetchProduct(obj.id, data));
      // let's refresh the products list
      dispatch(invalidateProducts());
    };

    ajaxPromise.then(onSuccess);
    return ajaxPromise;
  };
}
