import React from 'react';
import Autosuggest from 'react-autosuggest';


// The presentational component used to input a customer having an autosuggestion
// dropdown menu with the existing customers.
export default React.createClass({
  contextTypes: {
    router: React.PropTypes.object.isRequired
  },
  propTypes: {
    setCustomer: React.PropTypes.func.isRequired,
    getCustomer: React.PropTypes.func.isRequired,
    fetchSuggestions: React.PropTypes.func.isRequired
  },
  inputAttr: function() {
    return {
      placeholder: i18n.homepage.customerPlaceholder,
      className: 'form-control',
      onChange: this.onInputChanged,
      id: 'input-customer'
    };
  },
  onInputChanged: function(value) {
    if (this._suggestion_selected) {
      // Skip events generated from the suggestions.
      this._suggestion_selected = undefined;
      return;
    }

    this.props.setCustomer({
      fullname: value,
      id: undefined
    });
  },
  renderSuggestion: function(suggestion, _input) {
    return (typeof suggestion.surname !== 'undefined')
      ? `${suggestion.name} ${suggestion.surname}`
      : suggestion.name;
  },
  getSuggestionValue: function(suggestion) {
    return (typeof suggestion.surname !== 'undefined')
      ? `${suggestion.name} ${suggestion.surname}`
      : suggestion.name;
  },
  onSuggestionSelected: function(suggestion, event) {
    event.preventDefault();
    this.props.setCustomer({
      fullname: this.getSuggestionValue(suggestion),
      id: suggestion.id
    });
    this._suggestion_selected = 1;
  },
  render: function() {
    return (
      <Autosuggest
        suggestions={this.props.fetchSuggestions}
        suggestionRenderer={this.renderSuggestion}
        onSuggestionSelected={this.onSuggestionSelected}
        suggestionValue={this.getSuggestionValue}
        inputAttributes={this.inputAttr()}
        value={this.props.getCustomer().fullname}
       />
    );
  }
});