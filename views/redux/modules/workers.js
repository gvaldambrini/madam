const RESPONSE_FETCH = 'workers/RESPONSE_FETCH';

import {
  List,
  Map,
  fromJS
} from 'immutable';


export default function reducer(state = Map({
  loaded: false,
  workerList: List()
}), action) {
  switch (action.type) {
    case RESPONSE_FETCH:
      return state.merge(
        Map({
          loaded: true,
          workerList: action.payload
        }));
    default:
      return state;
  }
}


function responseFetchWorkers(workers) {
  return {
    type: RESPONSE_FETCH,
    payload: workers,
    error: false
  };
}

function fetchWorkers() {
  return dispatch => {
    $.ajax({
      url: '/settings/workers',
      method: 'get',
      success: function(data) {
        dispatch(responseFetchWorkers(fromJS(data.workers)));
      }
    });
  };
}

function shouldFetchWorkers(state) {
  const workers = state.workers;
  if (!workers.get('loaded')) {
    return true;
  }
  return false;
}

export function fetchWorkersIfNeeded() {
  return (dispatch, getState) => {
    if (shouldFetchWorkers(getState())) {
      return dispatch(fetchWorkers());
    }
  };
}

export function saveWorkers(workers) {
  return dispatch => {
    const ajaxPromise = $.ajax({
      url: '/settings/workers',
      method: 'put',
      contentType: 'application/json',
      data: JSON.stringify({workers: workers})
    });

    const onSuccess = function(data) {
      dispatch(responseFetchWorkers(fromJS(data.workers)));
    };

    ajaxPromise.then(onSuccess);
    return ajaxPromise;
  };
}
