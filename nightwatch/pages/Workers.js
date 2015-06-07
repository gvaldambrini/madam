module.exports = function (browser) {

    this.enableEdit = function() {
      return browser.click('form button.btn-primary');
    };

    this.set = function(index, obj) {
        return browser.execute(function(index, obj) {
            var element = $('form input[type=text]:eq(' + index + ')');
            element.val(obj.name);
            element.parents('.colorpicker-element').colorpicker('setValue', obj.color);
        }, [index, obj]);
    };

    this.expected = function(index, obj) {
        browser.execute(function(index, obj) {
            var element = $('form input[type=text]:eq(' + index + ')');
            return {
                name: element.val(),
                color: element.parents('.colorpicker-element').colorpicker('getValue')
            };
        }, [index, obj], function(result) {
            browser.assert.equal(result.value.name, obj.name);
            browser.assert.equal(result.value.color, obj.color);
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

    this.goToServices = function() {
        browser
          .waitForElementVisible('.content-header', 1000)
          .jqueryClick('.content-header a:contains("Services")');

        return browser;
    };
};