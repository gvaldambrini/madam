import React from 'react';

import { fnRenderErrors } from './util';
import FormInputUi from './FormInputUi';
import FormInputAndCheckboxUi from './FormInputAndCheckboxUi';
import FormInputRadioUi from './FormInputRadioUi';
import FormInputDateUi from './FormInputDateUi';
import FormTextAreaUi from './FormTextAreaUi';


// The customer form presentational component.
export default React.createClass({
  propTypes: {
    errors: React.PropTypes.array.isRequired,
    data: React.PropTypes.object.isRequired,
    inputChange: React.PropTypes.func.isRequired,
    submit: React.PropTypes.func.isRequired,
    submitText: React.PropTypes.string.isRequired,
    submitAndAdd: React.PropTypes.string,
    formTitle: React.PropTypes.string.isRequired
  },
  handleSubmit: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.submit(event.currentTarget.name === 'submit-and-add');
  },
  renderHtml: function(element) {
    return {
      __html: element
    };
  },
  render: function() {
    let additionalButtons;
    if (typeof this.props.submitAndAdd !== 'undefined') {
      additionalButtons = (
        <button type="button" className="btn btn-primary" name="submit-and-add"
          onClick={this.handleSubmit}>
          {this.props.submitAndAdd}
        </button>
      );
    }

    return (
      <div className="content-body">
        {fnRenderErrors(this.props.errors)}
        <div className="form-container" id="form-container">
          <form id="form" className="form-horizontal customer" method="post"
            action=''>
            <div className="form-group">
              <h4 className="col-sm-10 col-sm-offset-2">{this.props.formTitle}</h4>
            </div>
            <div className="form-group">
              <div className="col-sm-10 col-sm-offset-2 mandatory-fields"
                dangerouslySetInnerHTML={this.renderHtml(i18n.customers.mandatoryFields)}>
              </div>
            </div>
            <FormInputUi name='name' value={this.props.data.name}
              label={i18n.customers.name} focus={true} mandatory={true}
              handleChange={this.props.inputChange}/>
            <FormInputUi name='surname' value={this.props.data.surname}
              label={i18n.customers.surname} handleChange={this.props.inputChange}/>
            <FormInputAndCheckboxUi type='tel' value={this.props.data.mobile_phone}
              name='mobile_phone' label={i18n.customers.mobilePhone}
              cbname='allow_sms' cblabel={i18n.customers.allowSms}
              cbvalue={this.props.data.allow_sms}
              handleChange={this.props.inputChange}/>
            <FormInputUi type='tel' name='phone' value={this.props.data.phone}
              label={i18n.customers.phone} handleChange={this.props.inputChange}/>
            <FormInputAndCheckboxUi type='email' value={this.props.data.email}
              name='email' label={i18n.customers.email}
              cbname='allow_email' cblabel={i18n.customers.allowEmail}
              cbvalue={this.props.data.allow_email}
              handleChange={this.props.inputChange}/>
            <FormInputRadioUi name='discount' label={i18n.customers.discount}
              values={[
                {name: '0%',  value: '0'},
                {name: '10%', value: '10'},
                {name: '20%', value: '20'},
                {name: '30%', value: '30'}]}
              value={this.props.data.discount}
              handleChange={this.props.inputChange}/>
            <FormInputDateUi name='first_seen' value={this.props.data.first_seen}
              label={i18n.customers.firstSeen}
              handleChange={this.props.inputChange}/>
            <FormTextAreaUi name='notes' value={this.props.data.notes}
              label={i18n.customers.notes} handleChange={this.props.inputChange}/>

            <div className="form-group">
              <div className="col-sm-offset-2 col-sm-10">
                <button type="button" className="btn btn-primary" name="submit" onClick={this.handleSubmit}>
                  {this.props.submitText}
                </button>
                {additionalButtons}
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
});