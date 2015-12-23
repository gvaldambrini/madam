var Cookies = require('js-cookie');

var Link = require('react-router').Link;
var IndexLink = require('react-router').IndexLink;
var Router = require('react-router').Router;
var Route = require('react-router').Route;
var IndexRoute = require('react-router').IndexRoute;
var History = require('react-router').History;
var IndexRedirect = require('react-router').IndexRedirect;


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


var Sidebar = React.createClass({
  render: function() {
    return (
      <div className="col-sm-2 sidebar collapse">
        <ul className="nav nav-sidebar">
          <li>
            <IndexLink activeClassName="active" to="/">{i18n.sidebar.home}</IndexLink>
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

var Appointment = require('./appointments').Appointment;
var Appointments = require('./appointments').Appointments;
var AppointmentsRoot = require('./appointments').AppointmentsRoot;

var CustomerForm = require('./customers').CustomerForm;
var Customer = require('./customers').Customer;
var Customers = require('./customers').Customers;
var CustomersRoot = require('./customers').CustomersRoot;

var ProductForm = require('./products').ProductForm;
var Products = require('./products').Products;
var ProductsRoot = require('./products').ProductsRoot;

var ServicesForm = require('./settings').ServicesForm;
var WorkersForm = require('./settings').WorkersForm;
var SettingsRoot = require('./settings').SettingsRoot;

var LoginForm = require('./login').LoginForm;

function requireAuth(nextState, replaceState) {
    if (typeof Cookies.get('user') === 'undefined') {
      replaceState({ nextPathname: nextState.location.pathname }, '/login')
    }
}


var routes = function() {
  return (
    <Route component={App}>
      <Route path="/" component={Root} onEnter={requireAuth}>
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
