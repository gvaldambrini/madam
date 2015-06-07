module.exports = function (browser) {

    this.enableEdit = function() {
      return browser.click('form button.btn-primary');
    };

    this.set = function(index, name) {
        return browser.execute(function(index, name) {
            $('form input[type=text]:eq(' + index + ')').val(name);
        }, [index, name]);
    };

    this.expected = function(index, name) {
        browser.execute(function(index, name) {
            return $('form input[type=text]:eq(' + index + ')').val();
        }, [index, name], function(result) {
            browser.assert.equal(result.value, name);
        });
        return browser;
    };

    this.add = function() {
        return browser.click('.btn-add');
    };

    this.remove = function(index) {
        return browser.execute(function(index) {
            $('form input[type=text]:eq(' + index + ')')
              .parents('.form-group')
              .find('.btn-remove')
              .click();
        }, [index]);
    };

    this.save = function() {
        return browser.click('form button.btn-primary');
    };

    this.count = function(count) {
      return browser
        .assert.jqueryLengthIs('form input[type=text]', count, 'workers');
    };

    this.alertContains = function(message) {
        return browser
          .waitForElementVisible('.alert', 1000)
          .assert.containsText('.alert', message);
    };
};