module.exports = function (browser) {

    this.alertContains = function(message) {
        return browser
          .waitForElementVisible('.alert', 1000)
          .assert.containsText('.alert', message);
    };

    this.alertNotPresent = function() {
        return browser
          .assert.elementNotPresent('.alert');
    };

    this.followAlertLink = function() {
        return browser.click('.alert a');
    };

    this.createAppointment = function() {
        return browser
          .waitForElementVisible('.main .btn-primary', 1000)
          .click('.main .btn-primary');
    };

    this.tableCount = function(count) {
        return browser.execute(function() {
            return $('tbody tr').length;
        }, [], function(result) {
            browser.assert.equal(result.value, count);
        });
    };

    this.tableContains = function(index, date, services) {
        return browser.execute(function(index) {
            return {
              date: $('tbody tr:eq(' + index + ') td:eq(0)').text(),
              services: $('tbody tr:eq(' + index + ') td:eq(1)').text()
            };
        }, [index], function(result) {
            browser.assert.equal(result.value.date, date);
            browser.assert.equal(result.value.services, services);
        });
    };

    this.editAppointment = function(index) {
      return browser
        .click('tbody tr:nth-of-type(' + (index + 1) + ')');
    };

    this.deleteAppointment = function(index) {
      browser
        .click('tbody tr:nth-of-type(' +
          (index + 1) + ') span.glyphicon-trash');

      browser
        .waitForElementVisible('#popovers-container button.btn-confirm', 1000)
        .click('#popovers-container button.btn-confirm');

      return browser;
    };

};