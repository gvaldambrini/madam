import React from 'react';


// A radio form input presentational component.
export default React.createClass({
  propTypes: {
      handleChange: React.PropTypes.func.isRequired,
      name: React.PropTypes.string.isRequired,
      label: React.PropTypes.string.isRequired,
      values: React.PropTypes.arrayOf(React.PropTypes.shape({
        name: React.PropTypes.string.isRequired,
        value: React.PropTypes.string.isRequired
      })).isRequired
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
    const radioValues = this.props.values.map(
      obj =>
      <label className="radio-inline" key={obj.value}>
        <input type="radio" name={this.props.name} value={obj.value}
        checked={this.state.value === obj.value}
        onChange={this.handleChange}/>
        {obj.name}
      </label>
    );

    return (
      <div className="form-group">
        <label className="control-label col-sm-2" htmlFor={this.props.name}>
          {this.props.label}
        </label>
        <div className="col-sm-8">
          {radioValues}
        </div>
      </div>
    );
  }
});
