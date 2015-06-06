exports.command = function (selector, callback) {
  callback = callback || function () {};

  this.execute(function (selector) {
    return $(selector).length;
  }, [selector], function (result) {
    callback.call(this, result);
  });

  return this; // allows the command to be chained.
};