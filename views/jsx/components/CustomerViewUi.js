import React from 'react';
import { Link, IndexLink } from 'react-router';


// The main customer presentational component.
export default React.createClass({
  propTypes: {
    infoPath: React.PropTypes.string.isRequired,
    appPath: React.PropTypes.string.isRequired,
    appLinkDisabled: React.PropTypes.bool.isRequired
  },
  render: function() {
    let infoLink, appLink;

    if (!this.props.appLinkDisabled) {
      infoLink = (
        <IndexLink to={this.props.infoPath} activeClassName="active">
          {i18n.customers.headerInfo}
        </IndexLink>
      );
      appLink = (
        <Link to={this.props.appPath} activeClassName="active">
          {i18n.customers.headerAppointments}
        </Link>
      );
    }
    else {
      infoLink = (
        <Link to='' className="active" onClick={function(e) {e.preventDefault();}}>
          {i18n.customers.headerInfo}
        </Link>
      );
      appLink = (
        <Link to='' className="disabled">
          {i18n.customers.headerAppointments}
        </Link>
      );
    }

    return (
      <div>
        <div className="content-header">
          <ul>
            <li role="presentation">
              {infoLink}
            </li>
            <li role="presentation">
              {appLink}
            </li>
          </ul>
        </div>
        {this.props.children}
      </div>
    );
  }
});