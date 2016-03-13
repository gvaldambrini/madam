import React from 'react';

import { fnRenderErrors } from './util';
import SettingsInputUi from './SettingsInputUi';


// The services form presentational component.
export default React.createClass({
  propTypes: {
    loaded: React.PropTypes.bool.isRequired,
    errors: React.PropTypes.array.isRequired,
    items: React.PropTypes.array.isRequired,
    addNewInput: React.PropTypes.func.isRequired,
    removeInput: React.PropTypes.func.isRequired,
    disabled: React.PropTypes.bool.isRequired,
    inputChange: React.PropTypes.func.isRequired,
    submit: React.PropTypes.func.isRequired,
    route: React.PropTypes.shape({
      i18n: React.PropTypes.shape({
        title: React.PropTypes.string.isRequired,
        unlock: React.PropTypes.string.isRequired,
        save: React.PropTypes.string.isRequired
      }).isRequired
    }).isRequired
  },
  handleSubmit: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.submit();
  },
  render: function() {
    const that = this;
    if (!this.props.loaded) {
      return (
        <div className="content-body">
        </div>
      );
    }

    const settingsItems = this.props.items.map(function(item, index) {
      return (
        <SettingsInputUi
          value={item.name}
          key={item.id}
          inputId={item.id}
          label={i18n.settings.services.name}
          firstInput={index === 0 ? true : false}
          addNewInput={that.props.addNewInput}
          removeInput={that.props.removeInput}
          disabled={that.props.disabled}
          handleChange={that.props.inputChange}/>
      );
    });

    return (
      <div className="content-body">
        {fnRenderErrors(this.props.errors)}
        <div className="form-container" id="form-container">
          <form className="form-horizontal settings" method="post" action='' id="form">
            <div className="form-group">
              <h4 className="col-sm-10 col-sm-offset-2">{this.props.route.i18n.title}</h4>
            </div>
            <div className="form-controls" id="form-controls">
              {settingsItems}
            </div>
            <div className="form-group">
              <div className="col-sm-offset-2 col-sm-10">
                <button type="button" className="btn btn-primary"
                  name="submit" onClick={this.handleSubmit}>
                  {this.props.disabled ? this.props.route.i18n.unlock : this.props.route.i18n.save}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
});