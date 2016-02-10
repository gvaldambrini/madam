import React from 'react';
import { Link } from 'react-router';


// The sidebar presentational component.
export default React.createClass({
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