import React from 'react';


// A form input presentational component which includes a datepicker.
export default React.createClass({
  propTypes: {
    handleChange: React.PropTypes.func.isRequired,
    name: React.PropTypes.string.isRequired,
    label: React.PropTypes.string.isRequired,
    value: React.PropTypes.string,
    orientation: React.PropTypes.oneOf(['top', 'bottom', 'left', 'right', 'auto'])
  },
  componentWillMount: function() {
    if (typeof this.props.orientation !== 'undefined') {
      $.fn.datepicker.defaults.orientation = this.props.orientation;
    }
  },
  handleChange: function(event) {
    this.props.handleChange(this.props.name, $(event.currentTarget).val());
  },
  render: function() {
    const that = this;
    return (
      <div className="form-group">
        <label htmlFor={this.props.name} className="control-label col-sm-2">{this.props.label}</label>
        <div className="col-sm-10">
          <div className="input-group date" ref={
            function(div) {
              const $div = $(div);
              $div.datepicker({endDate: "0d"});
              $div.datepicker('setDate', that.props.value);
            }
          }>
            <input type="text" name={this.props.name}
              placeholder={config.date_format} className="form-control"
              ref={
                function(input) {
                  // the react onChange event is not fired from the datepicker, so let's
                  // use the standard event.
                  $(input)
                    .unbind('change', that.handleChange)
                    .change(that.handleChange);
                }
              }/>
            <span className="input-group-addon">
              <i className="glyphicon glyphicon-th"></i>
            </span>
          </div>
        </div>
      </div>
    );
  }
});