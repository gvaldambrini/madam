import {
  createStore,
  combineReducers,
  applyMiddleware,
  compose
} from 'redux';
import thunkMiddleware from 'redux-thunk';

import services from './modules/services';
import products from './modules/products';
import workers from './modules/workers';
import customers from './modules/customers';
import appointments from './modules/appointments';

export default function configureStore(routerReducer, initialState) {
  const rootReducer = combineReducers({
    services,
    products,
    workers,
    customers,
    appointments,
    routing: routerReducer
  });

  const store = createStore(
    rootReducer,
    initialState,
    compose(
      applyMiddleware(thunkMiddleware),
      window.devToolsExtension ? window.devToolsExtension() : f => f
    )
  );

  return store;
}