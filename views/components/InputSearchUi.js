import React from 'react';


// A seach input presentational component.
export default React.createClass({
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
  search: function() {
    const text = this.searchInput().val();
    this.searchClear().toggle(Boolean(text));
    this.props.search(text);
  },
  resetSearch: function() {
    this.searchInput().val('').focus();
    this.searchClear().hide();
    this.search();
  },
  render: function() {
    return (
      <form className="search-form">
        <input id="search-input" type="text"
          placeholder={this.props.placeholder} className="form-control"
          onChange={this.search}
          onKeyPress={
            function(event) {
              if (event.nativeEvent.keyCode === 13) {
                event.preventDefault();
                event.stopPropagation();
              }
            }
          }/>
        <span id="search-clear" className="glyphicon glyphicon-remove-circle"
          onClick={this.resetSearch}></span>
      </form>
    );
  }
});
