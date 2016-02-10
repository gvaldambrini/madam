import React from 'react';
import { Link } from 'react-router';


// The main settings presentational component.
export default React.createClass({
  render: function() {
    return (
      <div>
        <div className="content-header">
          <ul>
            <li role="presentation">
              <Link to="/settings/workers" activeClassName="active">
                {i18n.settings.workersName}
              </Link>
            </li>
            <li role="presentation">
              <Link to="/settings/services" activeClassName="active">
                {i18n.settings.servicesName}
              </Link>
            </li>
          </ul>
        </div>
        {this.props.children}
      </div>
    );
  }
});