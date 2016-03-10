import React from 'react';

import { fnRenderErrors } from './util';
import FormInputUi from './FormInputUi';
import FormInputDateUi from './FormInputDateUi';
import FormTextAreaUi from './FormTextAreaUi';


// The product form presentational component.
export default React.createClass({
  propTypes: {
    errors: React.PropTypes.array.isRequired,
    data: React.PropTypes.object.isRequired,
    inputChange: React.PropTypes.func.isRequired,
    submit: React.PropTypes.func.isRequired,
    submitText: React.PropTypes.string.isRequired,
    formTitle: React.PropTypes.string.isRequired
  },
  handleSubmit: function(event) {
    event.preventDefault();
    event.stopPropagation();

    this.props.submit();
  },
  renderHtml: function(element) {
    return {
      __html: element
    };
  },
  render: function() {
    return (
      <div className="content-body">
        {fnRenderErrors(this.props.errors)}
        <div className="form-container" id="form-container">
          <form id="form" className="form-horizontal product" method="post">
            <div className="form-group">
              <h4 className="col-sm-10 col-sm-offset-2">{this.props.formTitle}</h4>
            </div>
            <div className="form-group">
              <div className="col-sm-10 col-sm-offset-2 mandatory-fields"
              dangerouslySetInnerHTML={this.renderHtml(i18n.products.mandatoryFields)}>
              </div>
            </div>

            <FormInputUi name='name' value={this.props.data.name}
              label={i18n.products.name} focus={true} mandatory={true}
              handleChange={this.props.inputChange}
              handleSubmit={this.handleSubmit}/>
            <FormInputUi name='brand' value={this.props.data.brand}
              label={i18n.products.brand} handleChange={this.props.inputChange}
              handleSubmit={this.handleSubmit}/>
            <FormInputDateUi name='sold_date' value={this.props.data.sold_date}
              label={i18n.products.soldDate}
              handleChange={this.props.inputChange}/>
            <FormTextAreaUi name='notes' value={this.props.data.notes}
              label={i18n.products.notes}
              handleChange={this.props.inputChange}/>

            <div className="form-group">
              <div className="col-sm-offset-2 col-sm-10">
                <button type="submit" className="btn btn-primary" name="submit" onClick={this.handleSubmit}>
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