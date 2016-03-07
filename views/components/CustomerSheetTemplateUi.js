import React from 'react';
import moment from 'moment';


// A presentational component that can be used to print a customer sheet
export default React.createClass({
  propTypes: {
    data: React.PropTypes.object.isRequired,
    services: React.PropTypes.array.isRequired
  },
  renderGrid: function(services, apps) {
    if (apps.length === 0) {
      return;
    }

    const dates = apps.map(function(el, index) {
      if (typeof el.date === 'undefined') {
        return <th key={index}></th>;
      }
      return <th key={index}>{moment(el.date).format('DD/MM')}</th>;
    });

    const serviceList = services.map(function(service, index) {
      const workers = apps.map(function(app, index) {
        let worker;
        if (typeof app.services !== 'undefined') {
          for (let i = 0; i < app.services.length; i++) {
            if (app.services[i].description === service) {
              worker = app.services[i].worker;
            }
          }
        }
        return <td key={index}>{worker}</td>;
      });

      return (
        <tr key={index}>
          <td>{service}</td>
          {workers}
        </tr>
      );
    });

    return (
      <table className="table table-bordered appointment-grid">
        <thead>
          <tr>
            <th>{i18n.appointments.services}</th>
            {dates}
          </tr>
        </thead>
        <tbody>
          {serviceList}
        </tbody>
      </table>
    );
  },
  render: function() {
    let apps = [];
    if (typeof this.props.data.appointments !== 'undefined') {
      apps = this.props.data.appointments.slice();
    }

    let services = this.props.services;
    for (let i = 0; i < apps.length; i++) {
      for (let j = 0; j < apps[i].services.length; j++) {
        if (services.indexOf(apps[i].services[j].description) === -1) {
          services[services.length] = apps[i].services[j].description;
        }
      }
    }

    apps.sort((a, b) => a.date < b.date ? 1 : -1);
    const numApps = 7;
    if (apps.length !== 0) {
      while (apps.length < numApps) {
        apps[apps.length] = {};
      }
      apps = apps.slice(0, numApps);
    }


    let phones = '-';

    if (this.props.data.mobile_phone && this.props.data.phone) {
      phones = `${this.props.data.mobile_phone} / ${this.props.data.phone}`;
    }
    else if (this.props.data.mobile_phone) {
      phones = this.props.data.mobile_phone;
    }
    else if (this.props.data.phone) {
      phones = this.props.data.phone;
    }

    return (
      <div className="customer-sheet">
        <h3>{this.props.data.name} {this.props.data.surname}</h3>
        <div className="phones">{i18n.customers.phones} {phones}</div>
        <div className="notes">{this.props.data.notes}</div>
        <div className="appointment">
          {this.renderGrid(services, apps)}
        </div>
      </div>
    );
  }
});