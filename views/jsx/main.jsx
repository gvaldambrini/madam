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
import { Router, Route, Link, IndexRedirect, IndexRoute, browserHistory } from 'react-router';

import Cookies from 'js-cookie';

import '../javascripts/confirm-popover.js';
import '../stylesheets/style.scss';

import { Appointment, Appointments, AppointmentsRoot } from './appointments';
import { CustomerForm, Customer, Customers, CustomersRoot } from './customers';
import { ProductForm, Products, ProductsRoot } from './products';
import { ServicesForm, WorkersForm, SettingsRoot } from './settings';
import { LoginForm } from './login';
import { HomePage, Calendar, CalendarCustomer, CalendarAppointment, CalendarCustomerForm, CalendarAppointments } from './homepage';


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


const Sidebar = React.createClass({
  render: function() {
    return (
      <div className="col-sm-2 sidebar collapse">
        <ul className="nav nav-sidebar">
          <li>
            <Link activeClassName="active" to="/calendar">{i18n.sidebar.home}</Link>
          </li>
          <li>
            <Link activeClassName="active" to="/customers">{i18n.sidebar.customers}</Link>
          </li>
          <li>
            <Link activeClassName="active" to="/products">{i18n.sidebar.products}</Link>
          </li>
          <li>
            <Link activeClassName="active" to="/settings">{i18n.sidebar.settings}</Link>
          </li>
        </ul>
      </div>
    );
  }
});


const Navbar = React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  render: function() {
    const that = this;
    let logout;
    const currentUser = Cookies.get('user');
    if (typeof currentUser !== 'undefined') {
      logout =  (
        <div className="navbar-user">
          {currentUser}
          <div>
            <a href="#" onClick={
              function(event) {
                event.preventDefault();
                event.stopPropagation();

                $.ajax({
                  url: '/logout',
                  method: 'post',
                  success: function() {
                    Cookies.remove('user');
                    that.context.router.push('/login');
                  }
                });
              }
            }>{i18n.logout}</a>
          </div>
        </div>
      );
    }

    let toggle;
    if (this.props.showToggle) {
      toggle = (
        <button type="button" className="navbar-toggle" data-toggle="collapse" data-target=".sidebar">
          <span className="sr-only">Toggle navigation</span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
          <span className="icon-bar"></span>
        </button>
      );
    }
    return (
      <nav className="navbar navbar-inverse navbar-fixed-top">
          <div className="navbar-logo">
              <Link className="logo" to="/"></Link>
          </div>
          {logout}
          {toggle}
      </nav>
    );
  }
});


const Root = React.createClass({
  render: function() {
    return (
      <div className="row">
        <Sidebar/>
        <div className="col-sm-10 col-sm-offset-2 main">
          {this.props.children}
        </div>
      </div>
    );
  }
});


const App = React.createClass({
  render: function() {
    const showToggle = typeof Cookies.get('user') !== 'undefined';
    return (
      <div className="container-fluid">
        <Navbar
          showToggle={showToggle} />
        {this.props.children}
      </div>
    );
  }
});


function requireAuth(nextState, replace) {
    if (typeof Cookies.get('user') === 'undefined') {
      replace({
        pathname: '/login',
        state: { nextPathname: nextState.location.pathname }
      });
    }
}


const routes = function() {
  return (
    <Route component={App}>
      <Route path="/" component={Root} onEnter={requireAuth}>
        <IndexRedirect to="calendar" />
        // this would be ideally just a main route with path equal to "/calendar(/:date)",
        // however with that configuration the related link in the sidebar is not active
        // when accessing the calendar page with a specific date.
        // This trick (having the main root simply as "calendar") solve the problem.
        <Route path="calendar" component={HomePage}>
          <IndexRoute component={Calendar}/>
          <Route path=":date" component={Calendar}/>
          <Route path=":date/customers/:id" component={CalendarCustomer}>
            <IndexRoute component={CalendarCustomerForm}/>
            <Route path="appointments" component={AppointmentsRoot}>
              <IndexRoute component={CalendarAppointments}/>
              <Route path="new" component={CalendarAppointment}/>
              <Route path=":appid" component={CalendarAppointment}/>
              <Route path="planned/:appid" component={CalendarAppointment}/>
            </Route>
          </Route>
          <Route path=":date/appointments/planned/:appid/newcustomer" component={CalendarCustomer}>
            <IndexRoute component={CalendarCustomerForm}/>
          </Route>
        </Route>
        <Route path="customers" component={CustomersRoot}>
          <IndexRoute component={Customers}/>
          <Route path="new" component={Customer}>
            <IndexRoute component={CustomerForm}/>
          </Route>
          <Route path="edit/:id" component={Customer}>
            <IndexRoute component={CustomerForm}/>
            <Route path="appointments" component={AppointmentsRoot}>
              <IndexRoute component={Appointments}/>
              <Route path="new" component={Appointment}/>
              <Route path="edit/:appid" component={Appointment}/>
              <Route path="planned/:date/:appid" component={Appointment}/>
            </Route>
          </Route>
        </Route>
        <Route path="products" component={ProductsRoot}>
          <IndexRoute component={Products}/>
          <Route path="new" component={ProductForm}/>
          <Route path="edit/:id" component={ProductForm}/>
          <Route path="clone/:id" component={ProductForm}/>
        </Route>
        <Route path="settings" component={SettingsRoot}>
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
  <Router routes={routes()} history={browserHistory}/>,
  document.getElementById('main-container')
);
