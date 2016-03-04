import React from 'react';
import moment from 'moment';


// A presentational component that can be used to print a customer sheet
export default React.createClass({
  renderPhones: function() {
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
      <tr>
        <td>{i18n.customers.phones}</td>
        <td>{phones}</td>
      </tr>
    );
  },
  renderNotes: function() {
    if (this.props.data.notes) {
      return (
        <tr>
          <td>{i18n.customers.notes}</td>
          <td>{this.props.data.notes}</td>
        </tr>
      );
    }
  },
  renderDiscount: function() {
    if (typeof this.props.data.discount !== 'undefined') {
      return (
        <tr>
          <td>{i18n.customers.discount}</td>
          <td>{this.props.data.discount} %</td>
        </tr>
      );
    }
  },
  render: function() {
    let apps = this.props.data.appointments.slice();
    apps.sort((a, b) => a.date < b.date ? 1 : -1);
    // Prints only the last 3 appointments
    const appointments = apps.slice(0, 3).map(function(app) {
      let trNotes;
      if (app.notes) {
        trNotes = (
          <tr key={3}>
            <td>{i18n.appointments.notes}</td>
            <td>{app.notes}</td>
          </tr>
        );
      }

      return (
        <div key={app.date} className="app-table">
          <table className="table table-condensed">
          <tbody>
            <tr key={1}>
              <td>{i18n.appointments.date}</td>
              <td>{moment(app.date).format(config.date_format)}</td>
            </tr>
            <tr key={2}>
              <td>{i18n.appointments.services}</td>
              <td>{app.services.map(el => `${el.description} (${el.worker})`).join(' ')}</td>
            </tr>
            {trNotes}
            </tbody>
          </table>
        </div>
      );
    });

    return (
      <div className="customer-sheet">
        <h4>{this.props.data.name} {this.props.data.surname}</h4>
        <table className="table table-condensed">
          <tbody>
            {this.renderPhones()}
            {this.renderDiscount()}
            {this.renderNotes()}
          </tbody>
        </table>
        <div className="appointment">
          <div className="app-label">
            {i18n.homepage.appointments}
          </div>
          {appointments}
        </div>
      </div>
    );
  }
});