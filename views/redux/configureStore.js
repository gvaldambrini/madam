import {
  createStore,
  combineReducers,
  applyMiddleware
} from 'redux';
import thunkMiddleware from 'redux-thunk';

import services from './modules/services';
import products from './modules/products';
import workers from './modules/workers';

const rootReducer = combineReducers({
  services,
  products,
  workers
});

export default function configureStore(initialState) {
  const store = createStore(
    rootReducer,
    initialState,
    applyMiddleware(thunkMiddleware)
  );

  return store;
}