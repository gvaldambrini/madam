import 'jquery/dist/jquery.min.js';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';

import 'bootstrap-datepicker/dist/css/bootstrap-datepicker.min.css';
import 'bootstrap-colorpicker/dist/css/bootstrap-colorpicker.min.css';

import 'bootstrap-datepicker/dist/js/bootstrap-datepicker.min.js';
import 'bootstrap-datepicker/dist/locales/bootstrap-datepicker.it.min.js';
import 'bootstrap-colorpicker/dist/js/bootstrap-colorpicker.min.js';

import React from 'react';
import ReactDOM from 'react-dom';
import {
  Router,
  Route,
  IndexRedirect,
  IndexRoute,
  browserHistory
} from 'react-router';

import { Provider } from 'react-redux';
import configureStore from './redux/configureStore';

import Cookies from 'js-cookie';

import '../javascripts/confirm-popover.js';
import '../stylesheets/style.scss';

import {
  MainView,
  LoginForm,
  CustomerForm,
  CalendarCustomerForm,
  CustomerView,
  CalendarCustomerView,
  CalendarAppointmentView,
  CustomersView,
  ProductForm,
  ProductsView,
  AppointmentView,
  AppointmentsView,
  CalendarAppointmentsView,
  CalendarView,
  ServicesForm,
  WorkersForm
} from './containers';

import {
  MainContentUi,
  WrapperUi,
  SettingsViewUi
} from './components';

function csrfSafeMethod(method) {
  // these HTTP methods do not require CSRF protection
  return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

$.ajaxSetup({
  beforeSend: function(xhr, settings) {
    if (!csrfSafeMethod(settings.type)) {
      xhr.setRequestHeader("x-csrf-token", Cookies.get('csrf'));
    }
  }
});

// Datepicker default settings
$.fn.datepicker.defaults.language = config.language;
$.fn.datepicker.defaults.daysOfWeekDisabled = "0";
$.fn.datepicker.defaults.format = config.date_format.toLowerCase();
$.fn.datepicker.defaults.autoclose = true;
$.fn.datepicker.defaults.weekStart = 1;
$.fn.datepicker.defaults.todayHighlight = true;


function requireAuth(nextState, replace) {
    if (typeof Cookies.get('user') === 'undefined') {
      replace({
        pathname: '/login',
        state: { nextPathname: nextState.location.pathname }
      });
    }
}

const store = configureStore();

const routes = function() {
  return (
    <Route component={MainView}>
      <Route path="/" component={MainContentUi} onEnter={requireAuth}>
        <IndexRedirect to="calendar" />
        // this would be ideally just a main route with path equal to "/calendar(/:date)",
        // however with that configuration the related link in the sidebar is not active
        // when accessing the calendar page with a specific date.
        // This trick (having the main root simply as "calendar") solve the problem.
        <Route path="calendar" component={WrapperUi}>
          <IndexRoute component={CalendarView}/>
          <Route path=":date" component={CalendarView}/>
          <Route path=":date/customers/:id" component={CalendarCustomerView}>
            <IndexRoute component={CalendarCustomerForm}/>
            <Route path="appointments" component={WrapperUi}>
              <IndexRoute component={CalendarAppointmentsView}/>
              <Route path="new" component={CalendarAppointmentView}/>
              <Route path=":appid" component={CalendarAppointmentView}/>
              <Route path="planned/:appid" component={CalendarAppointmentView}/>
            </Route>
          </Route>
          <Route path=":date/appointments/planned/:appid/newcustomer" component={CalendarCustomerView}>
            <IndexRoute component={CalendarCustomerForm}/>
          </Route>
        </Route>
        <Route path="customers" component={WrapperUi}>
          <IndexRoute component={CustomersView}/>
          <Route path="new" component={CustomerView}>
            <IndexRoute component={CustomerForm}/>
          </Route>
          <Route path="edit/:id" component={CustomerView}>
            <IndexRoute component={CustomerForm}/>
            <Route path="appointments" component={WrapperUi}>
              <IndexRoute component={AppointmentsView}/>
              <Route path="new" component={AppointmentView}/>
              <Route path="edit/:appid" component={AppointmentView}/>
              <Route path="planned/:date/:appid" component={AppointmentView}/>
            </Route>
          </Route>
        </Route>
        <Route path="products" component={WrapperUi}>
          <IndexRoute component={ProductsView}/>
          <Route path="new" component={ProductForm}/>
          <Route path="edit/:id" component={ProductForm}/>
          <Route path="clone/:id" component={ProductForm}/>
        </Route>
        <Route path="settings" component={SettingsViewUi}>
          <IndexRedirect to="workers" />
          <Route path="workers" i18n={i18n.settings.workers} component={WorkersForm}/>
          <Route path="services" i18n={i18n.settings.services} component={ServicesForm}/>
        </Route>
      </Route>
      <Route path="/login" component={LoginForm}/>
    </Route>
  );
};

ReactDOM.render(
  <Provider store={store}>
    <Router routes={routes()} history={browserHistory}/>
  </Provider>,
  document.getElementById('main-container')
);
