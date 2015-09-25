module.exports = function (browser) {

    this.createCustomer = function() {
        return browser
          .waitForElementVisible('.main .btn-primary', 1000)
          .click('.main .btn-primary');
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

    this.tableContains = function(index, name, surname, phone, last_seen) {

        return browser.execute(function(index) {
            var row = $('tbody tr:eq(' + index + ')');
            return {
              name: row.find('td:eq(0)').text(),
              surname: row.find('td:eq(1)').text(),
              phone: row.find('td:eq(2)').text(),
              last_seen: row.find('td:eq(3)').text()
            };
        }, [index], function(result) {
            browser.assert.equal(result.value.name, name, 'Test the customer name');
            browser.assert.equal(result.value.surname, surname || '', 'Test the customer surname');
            browser.assert.equal(result.value.phone, phone || '', 'Test the customer phone');
            browser.assert.equal(result.value.last_seen, last_seen || '', 'Test the customer phone');
        });
    };

    this.tableCount = function(count) {
        browser.execute(function() {
            return $('tbody tr').length;
        }, [], function(result) {
            browser.assert.equal(result.value, count, 'Test the table length');
        });

      return browser;
    };

    this.search = function(text) {
        browser.clearValue('#search-input');
        // ugly hack to workaround the fact that the setValue for the search
        // input field does not trigger the keyboard events needed to update
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