var util = require('util');

module.exports = function (browser) {

    this.createCustomer = function() {
        browser
          .waitForElementVisible('.main .btn-primary', 1000)
          .click('.main .btn-primary');

        return browser;
    };

    this.editCustomer = function(index) {
      return browser
        .click('tbody tr:nth-of-type(' + (index + 1) + ')');
    };

    this.deleteCustomer = function(index) {
      browser
        .click('tbody tr:nth-of-type(' +
          (index + 1) + ') span.glyphicon-trash');

      browser
        .waitForElementVisible('#popovers-container button.btn-confirm', 1000)
        .click('#popovers-container button.btn-confirm');

      return browser;
    };

    this.alertContains = function(message) {
        return browser
          .waitForElementVisible('#customers-table-container .alert', 1000)
          .assert.containsText('#customers-table-container .alert', message);
    };

    this.alertNotPresent = function() {
        return browser
          .assert.elementNotPresent('#customers-table-container .alert');
    };

    this.tableContains = function(index, name, surname, phone) {
        browser
            .assert.containsText(
              'tbody tr:nth-of-type(' + (index + 1) + ') td:nth-of-type(1)',
              name,
              util.format(
                'Testing if the name of the customer n. %s contains text: "%s"',
                index,
                name));
        browser
            .assert.containsText(
              'tbody tr:nth-of-type(' + (index + 1) + ') td:nth-of-type(2)',
              surname,
              util.format(
                'Testing if the surname of the customer n. %s contains text: "%s"',
                index,
                surname));

        browser
            .assert.containsText(
                'tbody tr:nth-of-type(' + (index + 1) + ') td:nth-of-type(3)',
                phone || '',
                util.format(
                  'Testing if the phone of the customer n. %s contains text: "%s"',
                  index,
                  phone || ''));

        return browser;
    };

    this.tableCount = function(count) {
        browser.execute(function() {
            return $('tbody tr').length;
        }, [], function(result) {
            browser.assert.equal(result.value, count);
        });

      return browser;
    };

    this.search = function(text) {
        browser.clearValue('#search-input');
        // ugly hack to workaround the fact that the setValue for the search
        // input field do not send every keyboard event as needed to update
        // the results.
        for (var i = 0; i < text.length; i++) {
          browser
            .setValue('#search-input', text[i]);
        }

        return browser;
    };

    this.resetSearch = function() {
      return browser.click('#search-clear');
    };
};