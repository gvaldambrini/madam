import {
  createStore,
  combineReducers,
  applyMiddleware
} from 'redux';
import thunkMiddleware from 'redux-thunk';

import services from './modules/services';

const rootReducer = combineReducers({
  services
});

export default function configureStore(initialState) {
  const store = createStore(
    rootReducer,
    initialState,
    applyMiddleware(thunkMiddleware)
  );

  return store;
}