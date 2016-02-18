import React from 'react';

import { fnRenderErrors } from './util';
import SettingsInputUi from './SettingsInputUi';

import ImmutablePropTypes from 'react-immutable-proptypes';


// The services form presentational component.
export default React.createClass({
  propTypes: {
    loaded: React.PropTypes.bool.isRequired,
    errors: ImmutablePropTypes.list.isRequired,
    items: ImmutablePropTypes.list.isRequired,
    addNewInput: React.PropTypes.func.isRequired,
    removeInput: React.PropTypes.func.isRequired,
    unlocked: React.PropTypes.bool.isRequired,
    inputChange: React.PropTypes.func.isRequired,
    submit: React.PropTypes.func.isRequired
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
          value={item.get('name')}
          key={item.get('id')}
          inputId={item.get('id')}
          label={i18n.settings.services.name}
          firstInput={index === 0 ? true : false}
          addNewInput={that.props.addNewInput}
          removeInput={that.props.removeInput}
          disabled={!that.props.unlocked}
          handleChange={that.props.inputChange}/>
      );
    });

    return (
      <div className="content-body">
        {fnRenderErrors(this.props.errors.toArray())}
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
                  {this.props.unlocked ? this.props.route.i18n.save : this.props.route.i18n.unlock}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
});