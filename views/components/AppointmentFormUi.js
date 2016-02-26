import React from 'react';

import { fnRenderErrors } from './util';
import AppointmentServiceUi from './AppointmentServiceUi';
import FormInputDateUi from './FormInputDateUi';
import FormTextAreaUi from './FormTextAreaUi';


// The appointment form presentational component.
export default React.createClass({
  propTypes: {
    errors: React.PropTypes.array.isRequired,
    date: React.PropTypes.string.isRequired,
    notes: React.PropTypes.string,
    inputChange: React.PropTypes.func.isRequired,
    services: React.PropTypes.array.isRequired,
    workers: React.PropTypes.array.isRequired,
    updateService: React.PropTypes.func.isRequired,
    addService: React.PropTypes.func.isRequired,
    submit: React.PropTypes.func.isRequired,
    submitText: React.PropTypes.string.isRequired,
    formTitle: React.PropTypes.string.isRequired
  },
  handleSubmit: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.submit();
  },
  addService: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.addService();
  },
  render: function() {
    const services = this.props.services.map(
      (service, index) =>
      <AppointmentServiceUi serviceId={index.toString()}
        data={service}
        updateService={this.props.updateService}
        workers={this.props.workers} key={index} />
    );
    return (
      <div className="content-body">
        {fnRenderErrors(this.props.errors)}
        <div className="form-container">
          <form id="form" className="form-horizontal customer" method="post">
            <div className="form-group">
              <h4 className="col-sm-12">{this.props.formTitle}</h4>
            </div>
            <FormInputDateUi name='date' value={this.props.date}
              label={i18n.appointments.date} handleChange={this.props.inputChange}/>
            {services}

            <div className="form-group">
              <div className="col-sm-12">
                <button type="button" className="btn btn-default btn-add"
                  onClick={this.addService}>
                  {i18n.appointments.addService}
                </button>
              </div>
            </div>

            <FormTextAreaUi name='notes' value={this.props.notes}
              label={i18n.appointments.notes}
              formHorizontal={false}
              handleChange={this.props.inputChange}/>

            <div className="form-group">
              <div className="col-sm-12">
                <button type="button" className="btn btn-primary" name="submit"
                  onClick={this.handleSubmit}>
                  {this.props.submitText}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
});