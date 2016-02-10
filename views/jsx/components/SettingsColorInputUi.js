import React from 'react';


// The settings input with colorpicker presentational component.
export default React.createClass({
  propTypes: {
    addNewInput: React.PropTypes.func.isRequired,
    removeInput: React.PropTypes.func.isRequired,
    inputId: React.PropTypes.string.isRequired,
    label: React.PropTypes.string.isRequired,
    handleChange: React.PropTypes.func.isRequired,
    firstInput: React.PropTypes.bool.isRequired,
    disabled: React.PropTypes.bool.isRequired
  },
  getInitialState: function() {
    return {
      name: '',
      color: '#000000'
    };
  },
  componentWillMount: function() {
    this.setState({
      name: this.props.name,
      color: this.props.color
    });
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({
      name: nextProps.name,
      color: nextProps.color
    });
  },
  setColorPicker: function(element) {
    element.colorpicker({
      input: '.colorpicker-field',
      template: '<div class="colorpicker dropdown-menu">' +
          '<div class="colorpicker-saturation"><i><b></b></i></div>' +
          '<div class="colorpicker-hue"><i></i></div>' +
          '<div class="colorpicker-alpha"><i></i></div>' +
          '</div>'
    });
    element.colorpicker().on('changeColor.colorpicker', function(event) {
      element.find('.form-control').css('color', event.color.toHex());
      // trigger the change event on the hidden input
      element.find('input[name=color]').change();
      return true;
    });
  },
  colorChanged: function(event) {
    const $target = $(event.currentTarget);
    const color = $target.val();
    const text = $target.parent().find('input[type=text]').val();
    this.props.handleChange(this.props.inputId, text, color);
  },
  textChanged: function(event) {
    const $target = $(event.currentTarget);
    const color = $target.parent().find('input[name=color]').val();
    const text = $target.val();
    this.props.handleChange(this.props.inputId, text, color);
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
        <label className="control-label col-sm-2" htmlFor="name">{this.props.label}</label>
        <div className="col-sm-10">
          <div className="settings-row">
            <div className="col-xs-10">
              <div className="input-group" ref={
                function(div) {
                  if (div !== null) {
                    const $div = $(div);
                    that.setColorPicker($div);
                    // forward the native change event to the react event handler
                    $div.find('input[name=color]')
                      .unbind('change', that.colorChanged)
                      .change(that.colorChanged);
                    $div.find('.form-control').css(
                      'color', $div.colorpicker().data('colorpicker').color.toHex());
                    $div.colorpicker(that.props.disabled ? 'disable' : 'enable');
                  }
                }
              }>
                  <input className="form-control" type="text" name="name"
                    value={this.props.name} ref={
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
                    onChange={this.textChanged}
                    disabled={this.props.disabled}/>
                  <input type="hidden" name="color" className="colorpicker-field"
                    value={this.props.color}/>
                  <span className="input-group-addon colorpicker-selector" ref={
                    function(span) {
                      const $span = $(span);
                      if (that.props.disabled) {
                        $span.addClass('disabled');
                      }
                      else {
                        $span.removeClass('disabled');
                      }
                    }
                  }>
                    <i></i>
                  </span>
              </div>
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
