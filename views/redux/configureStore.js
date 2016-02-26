import {
  createStore,
  combineReducers,
  applyMiddleware
} from 'redux';
import thunkMiddleware from 'redux-thunk';

import services from './modules/services';
import products from './modules/products';
import workers from './modules/workers';
import customers from './modules/customers';
import appointments from './modules/appointments';

const rootReducer = combineReducers({
  services,
  products,
  workers,
  customers,
  appointments
});

export default function configureStore(initialState) {
  const store = createStore(
    rootReducer,
    initialState,
    applyMiddleware(thunkMiddleware)
  );

  return store;
}