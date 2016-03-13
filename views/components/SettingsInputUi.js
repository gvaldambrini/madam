import React from 'react';


// The settings input presentational component.
export default React.createClass({
  propTypes: {
    addNewInput: React.PropTypes.func.isRequired,
    removeInput: React.PropTypes.func.isRequired,
    inputId: React.PropTypes.string.isRequired,
    label: React.PropTypes.string.isRequired,
    handleChange: React.PropTypes.func.isRequired,
    firstInput: React.PropTypes.bool.isRequired,
    disabled: React.PropTypes.bool.isRequired,
    value: React.PropTypes.string
  },
  getInitialState: function() {
    return {
      value: ''
    };
  },
  componentWillMount: function() {
    this.setState({value: this.props.value});
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({value: nextProps.value});
  },
  add: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.addNewInput();
  },
  remove: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.removeInput(this.props.inputId);
  },
  render: function() {
    let actionButton;
    if (this.props.firstInput) {
      actionButton = (
        <button className="btn btn-default btn-add"
          type="button" onClick={this.add} disabled={this.props.disabled}>
          <i className="glyphicon glyphicon-plus"></i>
        </button>
      );
    }
    else {
      actionButton = (
        <button className="btn btn-default btn-remove"
          type="button" onClick={this.remove} disabled={this.props.disabled}>
          <i className="glyphicon glyphicon-minus"></i>
        </button>
      );
    }

    const that = this;
    return (
      <div className="form-group">
        <label className="control-label col-sm-2" htmlFor="name">
          {this.props.label}
        </label>
        <div className="col-sm-10">
          <div className="settings-row">
            <div className="col-xs-10">
              <input className="form-control" type="text" name="name"
                value={this.state.value}
                ref={
                  // workaround needed to trigger the onChange handler (textChanged in this case)
                  // from jQuery (which in turn needs to call the change() after the val('something'))
                  // that is not the "normal" usage from a real user but is required to have tests
                  // working.
                  function(input) {
                    if (input !== null) {
                      $(input)
                        .unbind('change', that.textChanged)
                        .change(that.textChanged);
                    }
                  }
                }
                onChange={function(event) {
                  that.props.handleChange(that.props.inputId, event.currentTarget.value);
                }}
                disabled={this.props.disabled}/>
            </div>
            <div className="col-xs-1">
              {actionButton}
            </div>
          </div>
        </div>
      </div>
    );
  }
});