import React from 'react';


// A form input presentational component.
export default React.createClass({
  propTypes: {
      handleChange: React.PropTypes.func.isRequired,
      name: React.PropTypes.string.isRequired,
      label: React.PropTypes.string.isRequired,
      value: React.PropTypes.string,
      type: React.PropTypes.string,
      focus: React.PropTypes.bool,
      mandatory: React.PropTypes.bool
  },
  getDefaultProps: function() {
    return {
      type: 'text'
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
  render: function() {
    const that = this;
    let mandatoryStar;
    if (this.props.mandatory) {
      mandatoryStar = <span className="mandatory">*</span>;
    }

    return (
      <div className="form-group">
        <label className="control-label col-sm-2" htmlFor={this.props.name}>
          {this.props.label}
          {mandatoryStar}
        </label>
        <div className="col-sm-10">
          <input className="form-control" type={this.props.type}
            name={this.props.name} placeholder={this.props.label}
            autoFocus={this.props.focus}
            value={this.state.value}
            onChange={function(event) {
                that.props.handleChange(that.props.name, event.currentTarget.value);
              }}/>
        </div>
      </div>
    );
  }
});