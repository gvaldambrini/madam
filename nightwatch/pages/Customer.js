var field_map = {
    name: 'name',
    surname: 'surname',
    mobile: 'mobile_phone',
    phone: 'phone',
    email: 'email'
};

module.exports = function (browser) {

    this.fillForm = function(obj) {
        browser.waitForElementVisible('form', 1000);
        for (var prop in obj) {
            browser
              .clearValue('input[name=' + field_map[prop] + ']')
              .setValue('input[name=' + field_map[prop] + ']', obj[prop]);
        }
        return browser;
    };

    this.expectedFields = function(obj) {

        for (var prop in obj) {
            browser.assert.value('input[name=' + field_map[prop] + ']', obj[prop]);
        }
        return browser;
    };

    this.submit = function() {
        return browser.click('button[name=submit]');
    };

    this.submitAndAdd = function() {
        return browser.click('button[name=submit_and_add]');
    };

    this.goToAppointments = function() {
        browser
          .waitForElementVisible('.content-header', 1000)
          .jqueryClick('.content-header a:contains("Appointments")');

        return browser;
    };
};