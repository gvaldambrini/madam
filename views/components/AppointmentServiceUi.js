import React from 'react';


// The presentational component that allows the user to input a service
// and the name of the worker that performs it.
export default React.createClass({
  propTypes: {
    serviceId: React.PropTypes.string.isRequired,
    updateService: React.PropTypes.func.isRequired,
    data: React.PropTypes.object.isRequired,
    workers: React.PropTypes.array.isRequired
  },
  getInitialState: function() {
    return {
      description: '',
      worker: {},
      checked: false
    };
  },
  componentWillMount: function() {
    this.setState({
      description: this.props.data.description,
      worker: this.props.data.worker,
      checked: this.props.data.checked
    });
  },
  componentWillReceiveProps: function(nextProps) {
    this.setState({
      description: nextProps.data.description,
      worker: nextProps.data.worker,
      checked: nextProps.data.checked
    });
  },
  handleChange: function(event) {
    const target = event.currentTarget;
    const data = this.state;
    if (target.name ===  'service') {
      data.description = target.value;
    }
    else if (target.name ===  'enabled') {
      data.checked = target.checked;
    }
    this.props.updateService(this.props.serviceId, data);
  },
  switchWorker: function(event) {
    // change the current worker to be the next one
    const $button = $(event.currentTarget);
    const $groupBtn = $button.closest('.input-group-btn');
    const $workers = $groupBtn.find('ul a');
    let newIndex = 0;
    for (let i = 0; i < $workers.length; i++) {
      if ($($workers[i]).text() === $button.text()) {
        newIndex = (i + 1) % $workers.length;
        break;
      }
    }
    const $newWorker = $($workers[newIndex]);
    const data = this.state;
    data.worker = {
      name: $newWorker.text(),
      color: $newWorker.css('color')
    };

    this.props.updateService(this.props.serviceId, data);
  },
  selectWorker: function(event) {
    event.preventDefault();
    event.stopPropagation();

    // set the current worker from the selected one in the dropdown
    const $target = $(event.currentTarget);

    const data = this.state;
    data.worker = {
      name: $target.text(),
      color: $target.css('color')
    };

    this.props.updateService(this.props.serviceId, data);
    $target.closest('ul').parent().find('.dropdown-toggle').dropdown('toggle');
  },
  render: function() {
    const that = this;
    const workers = this.props.workers.map(
      worker =>
      <li key={worker.name}>
        <a style={{color: worker.color}} href="#" ref={function(a) {
          // Probably due to a react.js bug, the standard onClick
          // method does not call the selectWorker when the click
          // is performed via javascript (using the console or
          // nightwatch).
          // The jQuery approach does not suffer this problem.
          $(a)
            .unbind('click', that.selectWorker)
            .on('click', that.selectWorker);
        }}>
          {worker.name}
        </a>
      </li>
    );

    return (
      <div className="form-group service">
        <div className="col-sm-12">
          <div className="input-group">
            <span className="input-group-addon">
              <input type="checkbox" name="enabled" value={this.props.serviceId}
                checked={this.state.checked}
                onChange={this.handleChange}/>
            </span>
            <input type="text" className="form-control"
              value={this.state.description} name="service"
              onChange={this.handleChange}
              ref={
                // workaround needed to trigger the onChange handler (handleChange in this case)
                // from jQuery (which in turn needs to call the change() after the val('something'))
                // that is not the "normal" usage from a real user but is required to have tests
                // working.
                function(input) {
                  if (input !== null) {
                    $(input)
                      .unbind('change', that.handleChange)
                      .change(that.handleChange);
                  }
                }
              }
              />
            <div className="input-group-btn">
              <button type="button" className="btn btn-default btn-click"
                style={{color: this.state.worker.color}} onClick={this.switchWorker}>
                {this.state.worker.name}
              </button>
              <button type="button" className="btn btn-default dropdown-toggle" data-toggle="dropdown">
                  <span className="caret"></span>
              </button>
              <ul className="dropdown-menu dropdown-menu-right" role="menu">
                {workers}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
});