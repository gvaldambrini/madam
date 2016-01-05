import React from 'react';
import ReactDOM from 'react-dom';
import { Router, Route, Link, IndexRedirect, IndexLink, IndexRoute, History } from 'react-router';

import Cookies from 'js-cookie';

import { Appointment, Appointments, AppointmentsRoot } from './appointments';
import { CustomerForm, Customer, Customers, CustomersRoot } from './customers';
import { ProductForm, Products, ProductsRoot } from './products';
import { ServicesForm, WorkersForm, SettingsRoot } from './settings';
import { LoginForm } from './login';
import { HomePage, Calendar } from './homepage';


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


var Sidebar = React.createClass({
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


var Navbar = React.createClass({
  mixins: [History],
  render: function() {
    var that = this;
    var logout;
    var currentUser = Cookies.get('user');
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
                    that.history.pushState(null, '/login');
                  }
                });

              }
            }>{i18n.logout}</a>
          </div>
        </div>
      );
    }

    var toggle;
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


var Root = React.createClass({
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


var App = React.createClass({
  render: function() {
    var showToggle = typeof Cookies.get('user') !== 'undefined';
    return (
      <div className="container-fluid">
        <Navbar
          showToggle={showToggle} />
        {this.props.children}
      </div>
    );
  }
});


function requireAuth(nextState, replaceState) {
    if (typeof Cookies.get('user') === 'undefined') {
      replaceState({ nextPathname: nextState.location.pathname }, '/login')
    }
}


var routes = function() {
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
          <Route path="/calendar(/:date)" component={Calendar}/>
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
              <Route path="edit/:appnum" component={Appointment}/>
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
}

var createBrowserHistory = require('history/lib/createBrowserHistory');
var history = createBrowserHistory();

ReactDOM.render(
  <Router routes={routes()} history={history}/>,
  document.getElementById('main-container')
);
