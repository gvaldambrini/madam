module.exports = function (browser) {

    this.enableEdit = function() {
      return browser.click('form button.btn-primary');
    };

    this.set = function(index, name) {
        return browser.execute(function(index, name) {
            $node = $('form input[type=text]:eq(' + index + ')');
            $node.val(name);
            $node.change();
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
        browser.execute(function() {
            return $('form input[type=text]').length;
        }, [], function(result) {
            browser.assert.equal(result.value, count);
        });

      return browser;
    };

    this.alertContains = function(message) {
        return browser
          .waitForElementVisible('.alert', 1000)
          .assert.containsText('.alert', message);
    };
};