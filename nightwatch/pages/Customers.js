module.exports = function (browser) {
    this.createCustomer = function(name, surname) {
        browser
          .waitForElementVisible('.main .btn-primary', 1000)
          .click('.main .btn-primary')
          .waitForElementVisible('form', 1000)
          .setValue('input[name=name]', name)
          .setValue('input[name=surname]', surname)
          .click('button[name=submit]');

        return browser;
    };

    this.alertContains = function(message) {
        return browser
          .assert.containsText('#customers-table-container .alert', message);
    };

    this.alertNotPresent = function() {
        return browser
          .assert.elementNotPresent('#customers-table-container .alert');
    };

    this.tablePresent = function() {
        return browser
          .assert.elementPresent('#customers-table-container table');
    };

    this.tableContains = function(index, name, surname) {
        browser
            .assert.containsText(
                '#customers-table-container tbody tr:nth-of-type(' +
                    (index + 1) + ') td:nth-of-type(1)', name);
        browser
            .assert.containsText(
                '#customers-table-container tbody tr:nth-of-type(' +
                    (index + 1) + ') td:nth-of-type(2)', surname);

        return browser;
    };
};