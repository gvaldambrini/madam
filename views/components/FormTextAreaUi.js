import React from 'react';


// A form textarea presentational component.
export default React.createClass({
  propTypes: {
      handleChange: React.PropTypes.func.isRequired,
      name: React.PropTypes.string.isRequired,
      label: React.PropTypes.string.isRequired,
      value: React.PropTypes.string,
      formHorizontal: React.PropTypes.bool
  },
  getDefaultProps: function() {
    return {
      formHorizontal: true
    };
  },
  getInitialState: function() {
    return {value: ''};
  },
  componentWillMount: function() {
    this.setState({value: this.props.value});
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({value: nextProps.value});
  },
  handleChange: function(event) {
    this.props.handleChange(this.props.name, event.currentTarget.value);
  },
  render: function() {
    const textarea = (
      <textarea name={this.props.name} className="form-control" rows="5"
        value={this.state.value}
        onChange={this.handleChange}>
      </textarea>
    );

    if (this.props.formHorizontal) {
      return (
        <div className="form-group">
          <label className="control-label col-sm-2">{this.props.label}</label>
          <div className="col-sm-10">
            {textarea}
          </div>
        </div>
      );
    }

    return (
      <div className="form-group">
        <div className="col-sm-12">
          <label className="control-label">{this.props.label}</label>
          {textarea}
        </div>
      </div>
    );
  }
});