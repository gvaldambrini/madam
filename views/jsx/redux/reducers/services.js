import { List, Map } from 'immutable';

import {
  REQUEST_FETCH_SERVICES,
  RESPONSE_FETCH_SERVICES,
  REQUEST_SAVE_SERVICES,
  RESPONSE_SAVE_SERVICES,
  UNLOCK_SERVICES_FORM,
  RESET_SERVICES_FORM,
  ADD_SERVICE,
  REMOVE_SERVICE,
  UPDATE_SERVICE
} from '../actions';

import { parseErrors, parseServices, uuid4 } from '../util';


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

function services(state = Map({
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
      return state.updateIn(['items', index, 'name'], text => action.payload.text);
    }
    case UNLOCK_SERVICES_FORM:
      return state.set('unlocked', true);
    case RESET_SERVICES_FORM:
      return state.merge(
        Map({
          unlocked: false,
          items: List(state.get('savedItems')),
          errors: List()}));
    case RESPONSE_SAVE_SERVICES:
    case RESPONSE_FETCH_SERVICES:
      if (action.error) {
        return state.set('errors', parseErrors(action.payload));
      }
      else {
        const items = parseServices(action.payload);
        return state.merge(
          Map({
            loaded: true,
            items: items,
            savedItems: List(items),
            errors: List(),
            unlocked: false}));
      }
    default:
      return state;
  }
}

export default services;