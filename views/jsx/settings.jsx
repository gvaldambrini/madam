import React from 'react';
import { Link } from 'react-router';

import { fnRenderErrors, fnSubmitForm } from './forms';


var BaseRow = {
  add: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.addRow(event.currentTarget);
  },
  remove: function(event) {
    event.preventDefault();
    event.stopPropagation();
    this.props.removeRow(this.props.index);
  },
  actionButton: function() {
    if (this.props.index === 0) {
      return (
        <button className="btn btn-default btn-add" type="button" onClick={this.add} disabled={this.props.disabled}>
          <i className="glyphicon glyphicon-plus"></i>
        </button>
      );
    }

    return (
      <button className="btn btn-default btn-remove" type="button" onClick={this.remove} disabled={this.props.disabled}>
        <i className="glyphicon glyphicon-minus"></i>
      </button>
    );
  },
  render: function() {
    return (
      <div className="form-group">
        <label className="control-label col-sm-2" htmlFor="name">{this.props.label}</label>
        <div className="col-sm-10">
          <div className="settings-row">
            <div className="col-xs-10">
              {this.input()}
            </div>
            <div className="col-xs-1">
              {this.actionButton()}
            </div>
          </div>
        </div>
      </div>
    );
  }
};


var BaseSettingsForm = {
  uuid4: function () {
    //// return uuid of form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    var uuid = '', ii;
    for (ii = 0; ii < 32; ii += 1) {
      switch (ii) {
      case 8:
      case 20:
        uuid += '-';
        uuid += (Math.random() * 16 | 0).toString(16);
        break;
      case 12:
        uuid += '-';
        uuid += '4';
        break;
      case 16:
        uuid += '-';
        uuid += (Math.random() * 4 | 8).toString(16);
        break;
      default:
        uuid += (Math.random() * 16 | 0).toString(16);
      }
    }
    return uuid;
  },
  addRow: function() {
    var items = this.state.items.slice();
    var obj = this.newEmptyObj();

    obj.id = this.uuid4();
    items.push(obj);

    this.setState({
      items: items
    });
  },
  removeRow: function(index) {
    var items = this.state.items.slice();
    items.splice(index, 1);
    this.setState({
      items: items
    });
  },
  render: function() {
    if (!this.state.loaded) {
      return (
        <div className="content-body">
        </div>
      );
    }
    var settingsItems = this.state.items.map(this.settingsItem);

    return (
      <div className="content-body">
        {fnRenderErrors(this.state.errors)}
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
                <button type="button" className="btn btn-primary" name="submit" onClick={this.handleSubmit}>
                  {this.state.disabled ? this.props.route.i18n.unlock : this.props.route.i18n.save}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }
};


var SettingsRow = React.createClass({
  mixins: [BaseRow],
  getInitialState: function() {
    return {
      value: ''
    }
  },
  componentWillMount: function() {
    this.setState({value: this.props.value});
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({value: nextProps.value});
  },
  textChanged: function(event) {
    var $target = $(event.currentTarget);
    var rowId = $target.data('row-id');
    this.props.handleChange(rowId, $target.val());
  },
  input: function() {
    var that = this;
    return (
      <input className="form-control" type="text" name="name"
        value={this.state.value}
        ref={
          // workaround needed to trigger the onChange handler (textChanged in this case)
          // from jQuery (which in turn needs to call the change() after the val('something'))
          // that is not the "normal" usage from a real user but is required to have tests
          // working.
          function(input) {
            if (input != null) {
              $(input)
                .unbind('change', that.textChanged)
                .change(that.textChanged);
            }
          }
        }
        onChange={this.textChanged}
        disabled={this.props.disabled}
        data-row-id={this.props.rowId} />
    );
  }
});


var ServicesForm = React.createClass({
  mixins: [BaseSettingsForm],
  newEmptyObj: function() {
    return {
      name: ''
    }
  },
  loadItems: function(data) {
    // We need an unique and stable id so that React can perform
    // the reconciliation to understand who is the child removed
    // or added.
    var items = [];
    if (data.items.length === 0) {
      var emptyItem = this.newEmptyObj()
      emptyItem.id = this.uuid4();
      items[0] = emptyItem;
    }
    else {
      for (var i = 0; i < data.items.length; i++) {
        items[items.length] = {
          name: data.items[i],
          id: this.uuid4()
        }
      }
    }
    this.setState({
      items: items,
      errors: [],
      loaded: true,
      disabled: true
    });
  },
  componentWillMount: function() {
    var that = this;
    $.ajax({
      url: '/settings/services',
      method: 'get',
      success: that.loadItems
    });
  },
  getInitialState: function() {
    return {
      items: [],
      errors: [],
      disabled: true,
      submitText: this.props.route.i18n.save,
      loaded: false
    };
  },
  handleSubmit: function(event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.state.disabled) {
      this.setState({
        disabled: false
      });
      return;
    }

    var items = [];
    for (var i = 0; i < this.state.items.length; i++) {
      items[items.length] = this.state.items[i].name;
    }

    var data = {services: items};
    fnSubmitForm(this, '/settings/services', 'put', data, this.loadItems);
  },
  handleChange: function(rowId, text) {
    var items = this.state.items;

    for (var i = 0; i < items.length; i++) {
      if (items[i].id == rowId) {
        if (items[i].name == text) {
          return;
        }
        items[i].name = text;
        break;
      }
    }
    this.setState({
      items: items
    });
  },
  settingsItem: function(item, index) {
    return (
      <SettingsRow value={item.name}
        key={item.id} rowId={item.id}
        index={index}
        label={i18n.settings.services.name}
        addRow={this.addRow}
        removeRow={this.removeRow}
        disabled={this.state.disabled}
        handleChange={this.handleChange} />
    );
  }
});


var SettingsColorRow = React.createClass({
  mixins: [BaseRow],
  getInitialState: function() {
    return {
      name: '',
      color: '#000000'
    }
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
    var $target = $(event.currentTarget);
    var rowId = $target.parent().data('row-id');
    var color = $target.val();
    var text = $target.parent().find('input[type=text]').val();
    this.props.handleChange(rowId, text, color);
  },
  textChanged: function(event) {
    var $target = $(event.currentTarget);
    var rowId = $target.parent().data('row-id');
    var color = $target.parent().find('input[name=color]').val();
    var text = $target.val();
    this.props.handleChange(rowId, text, color);
  },
  input: function() {
    var that = this;

    return (
      <div className="input-group" data-row-id={this.props.rowId} ref={
        function(div) {
          if (div != null) {
            var $div = $(div);
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
            value={this.state.name} ref={
            // workaround needed to trigger the onChange handler (textChanged in this case)
            // from jQuery (which in turn needs to call the change() after the val('something'))
            // that is not the "normal" usage from a real user but is required to have tests
            // working.
              function(input) {
                if (input != null) {
                  $(input)
                    .unbind('change', that.textChanged)
                    .change(that.textChanged);
                }
              }
            }
            onChange={this.textChanged}
            disabled={this.props.disabled}/>
          <input type="hidden" name="color" className="colorpicker-field"
            value={this.state.color}/>
          <span className="input-group-addon colorpicker-selector" ref={
            function(span) {
              var $span = $(span);
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
    );
  }
});


var WorkersForm = React.createClass({
  mixins: [BaseSettingsForm],
  newEmptyObj: function() {
    return {
      name: '',
      color: config.defaultWorkerColor
    }
  },
  loadItems: function(data) {
    // We need an unique and stable id so that React can perform
    // the reconciliation to understand who is the child removed
    // or added.
    var items = [];
    if (data.items.length === 0) {
      var emptyItem = this.newEmptyObj()
      emptyItem.id = this.uuid4();
      items[0] = emptyItem;
    }
    else {
      for (var i = 0; i < data.items.length; i++) {
        items[items.length] = {
          name: data.items[i].name,
          color: data.items[i].color,
          id: this.uuid4()
        }
      }
    }

    this.setState({
      items: items,
      loaded: true,
      disabled: true
    });
  },
  componentWillMount: function() {
    var that = this;
    $.ajax({
      url: '/settings/workers',
      method: 'get',
      success: that.loadItems
    });
  },
  getInitialState: function() {
    return {
      items: [],
      errors: [],
      disabled: true,
      submitText: this.props.route.i18n.save,
      loaded: false
    };
  },
  handleChange: function(rowId, text, color) {
    var items = this.state.items;

    for (var i = 0; i < items.length; i++) {
      if (items[i].id == rowId) {
        if (items[i].name == text && items[i].color == color) {
          return;
        }
        items[i].name = text;
        items[i].color = color;
        break;
      }
    }
    this.setState({
      items: items
    });
  },
  handleSubmit: function(event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.state.disabled) {
      this.setState({
        disabled: false
      });
      return;
    }

    var data = {workers: this.state.items};
    fnSubmitForm(this, '/settings/workers', 'put', data, this.loadItems);
  },
  settingsItem: function(item, index) {
    return (
      <SettingsColorRow name={item.name} color={item.color}
        key={item.id} rowId={item.id}
        index={index}
        label={i18n.settings.workers.name}
        addRow={this.addRow}
        removeRow={this.removeRow}
        disabled={this.state.disabled}
        handleChange={this.handleChange} />
    );
  }
});


var SettingsRoot = React.createClass({
  render: function() {
    return (
      <div>
        <div className="content-header">
          <ul>
            <li role="presentation">
              <Link to="/settings/workers" activeClassName="active">{i18n.settings.workersName}</Link>
            </li>
            <li role="presentation">
              <Link to="/settings/services" activeClassName="active">{i18n.settings.servicesName}</Link>
            </li>
          </ul>
        </div>
        {this.props.children}
      </div>
    );
  }
});


module.exports = {
  ServicesForm: ServicesForm,
  WorkersForm: WorkersForm,
  SettingsRoot: SettingsRoot
};