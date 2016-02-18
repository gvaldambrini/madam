import { fromJS } from 'immutable';


// Other utility functions

export function uuid4() {
  //// return uuid of form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  let uuid = '', ii;
  for (ii = 0; ii < 32; ii += 1) {
    switch (ii) {
    case 8:
    case 20:
      uuid += '-';
      uuid += (Math.random() * 16 | 0).toString(16);
      break;
    case 12:
      uuid += '-';
      uuid += '4';
      break;
    case 16:
      uuid += '-';
      uuid += (Math.random() * 4 | 8).toString(16);
      break;
    default:
      uuid += (Math.random() * 16 | 0).toString(16);
    }
  }
  return uuid;
}

// API functions, used to send data to the server and converts
// Immutable data structures into plain js data structures.

export function prepareServices(services) {
  const items = [];
  for (let i = 0; i < services.size; i++) {
    items[items.length] = services.get(i).get('name');
  }
  return items;
}


// API functions, used to receive data from the server and converts
// js data structures to the Immutables ones.

export function parseErrors(errors) {
  return fromJS(errors.map(function(item) { return item.msg; }));
}

export function parseServices(services) {
  // We need an unique and stable id so that React can perform
  // the reconciliation to understand who is the child removed
  // or added.
  const items = [];
  if (services.length === 0) {
    items[0] = {
      name: '',
      id: uuid4()
    };
  }
  else {
    for (let i = 0; i < services.length; i++) {
      items[items.length] = {
        name: services[i],
        id: uuid4()
      };
    }
  }
  return fromJS(items);
}
