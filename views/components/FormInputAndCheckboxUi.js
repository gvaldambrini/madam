import React from 'react';


// A form input + checkbox presentational component.
export default React.createClass({
  propTypes: {
      handleChange: React.PropTypes.func.isRequired,
      name: React.PropTypes.string.isRequired,
      cblabel: React.PropTypes.string.isRequired,
      cbname: React.PropTypes.string.isRequired,
      label: React.PropTypes.string.isRequired,
      value: React.PropTypes.string,
      cbvalue: React.PropTypes.bool,
      type: React.PropTypes.string
  },
  getInitialState: function() {
    return {
      value: '',
      cbvalue: false
    };
  },
  componentWillMount: function() {
    this.setState({
      value: this.props.value,
      cbvalue: this.props.cbvalue
    });
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({
      value: nextProps.value,
      cbvalue: nextProps.cbvalue
    });
  },
  handleChange: function(event) {
    const target = event.currentTarget;
    const value = target.type === "checkbox" ? target.checked : target.value;
    this.props.handleChange(target.name, value);
  },
  render: function() {
    return (
      <div className="form-group">
        <label className="control-label col-sm-2" htmlFor={this.props.name}>
          {this.props.label}
        </label>
        <div className="col-sm-10">
          <input className="form-control" type={this.props.type}
            name={this.props.name} placeholder={this.props.label}
            value={this.state.value}
            onChange={this.handleChange}/>
        </div>
        <div className="col-sm-offset-2 col-sm-10">
          <div className="checkbox">
            <label>
              <input type="checkbox" name={this.props.cbname}
              checked={this.state.cbvalue}
              onChange={this.handleChange}/>
              {this.props.cblabel}
            </label>
          </div>
        </div>
      </div>
    );
  }
});