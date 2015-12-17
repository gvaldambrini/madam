module.exports = function (browser) {

    this.authenticate = function(username, password) {
        browser
          .clearValue('input[type=text]')
          .setValue('input[type=text]', username)
          .clearValue('input[type=password]')
          .setValue('input[type=password]', password)
          .waitForElementVisible('button[name=submit]', 1000)
          .click('button[name=submit]');

        return browser;
    };

    this.alertContains = function(message) {
        return browser
          .waitForElementVisible('#login-box .alert', 1000)
          .assert.containsText('#login-box .alert', message);
    };

    this.isLoginPage = function() {
        return browser
          .assert.elementPresent('#login-box');
    };
};