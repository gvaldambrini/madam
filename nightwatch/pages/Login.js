module.exports = function (browser) {

    this.authenticate = function(username, password) {
        browser
          .setValue('input[type=text]', username)
          .setValue('input[type=password]', password)
          .waitForElementVisible('button[name=submit]', 1000)
          .click('button[name=submit]');

        return browser;
    };
};