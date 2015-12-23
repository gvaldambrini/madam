var Cookies = require('js-cookie');


var InputSearch = React.createClass({
  propTypes: {
      search: React.PropTypes.func.isRequired,
      placeholder: React.PropTypes.string.isRequired
  },
  searchClear: function() {
    return $("#search-clear");
  },
  searchInput: function() {
    return $("#search-input");
  },
  render: function() {
    return (
      <form className="search-form">
        <input id="search-input" type="text"
          placeholder={this.props.placeholder} className="form-control"
          onChange={this.search}/>
        <span id="search-clear" className="glyphicon glyphicon-remove-circle"
          onClick={this.resetSearch}></span>
      </form>
    )
  },
  search: function() {
    var text = this.searchInput().val();
    this.searchClear().toggle(Boolean(text));
    this.props.search(text);
  },
  resetSearch: function() {
    this.searchInput().val('').focus();
    this.searchClear().hide();
    this.search();
  }
});


var PopoverTemplate = React.createClass({
  propTypes: {
      confirm: React.PropTypes.string.isRequired,
      cancel: React.PropTypes.string.isRequired,
  },
  render: function() {
    return (
      <div className="popover" role="tooltip">
        <div className="arrow"></div>
        <h3 className="popover-title"></h3>

        <div className="popover-body">
          <div className="popover-content"></div>
          <button type="submit" className="btn btn-primary btn-confirm" name="submit">{this.props.confirm}</button>
          <button type="submit" className="btn btn-default btn-cancel" name="submit">{this.props.cancel}</button>
        </div>
      </div>
    );
  }
});


var BaseTable = {
  deleteRow: function(url) {
    $.ajax({
      url: url,
      method: 'delete',
      complete: this.updateTable
    });
  },
  updateTable: function(obj, status) {
    if (status === 'success') {
      this.props.updateTable();
    }
  },
  renderHighlight: function(element) {
    return {
      __html: element
    }
  }
};


var BaseTableContainer = {
  fetchData: function(url, filterText) {
    var that = this;
    var ajaxArgs = {
      url: url,
      success: function(data) {
        that.setState({
          data: data,
          loaded: true
        });
      },
      error: function(xhr, textStatus, errorThrown) {
        if (xhr.status === 401) {
          Cookies.remove('user');
          that.history.pushState(null, '/login');
        }
      }
    };
    if (typeof filterText !== 'undefined') {
      ajaxArgs.data = {text: filterText};
    }
    $.ajax(ajaxArgs);
  },

};


module.exports = {
  InputSearch: InputSearch,
  PopoverTemplate: PopoverTemplate,
  BaseTable: BaseTable,
  BaseTableContainer: BaseTableContainer
};

