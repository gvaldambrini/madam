var util = require('util');
exports.assertion = function(selector, count, elementName) {

  var defaultMessage  = 'Testing if there are %s %s on the page';
  var errorMessage  = 'Error executing command';

  // Set default message
  this.message = util.format(defaultMessage, count, elementName);

  // The expected text
  this.expected = function () {
    return 'to find ' + count + ' ' + elementName + ' on page';
  };

  // returning true means assertion passed
  // returning false means assertion failed
  this.pass = function(value) {
    return (value == count);
  };

  // returning true means element could not be found
  this.failure = function (result) {
    var failed = (result === false || (result && result.status === -1));

    if (failed) {
      this.message = errorMessage;
    }

    return failed;
  };

  // passed result of calling this.command()
  this.value = function (result) {
    return result.value;
  };

  // interacts with page
  this.command = function (callback) {
    return this.api.jqueryLength(selector, callback);
  };

};