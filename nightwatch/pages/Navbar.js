module.exports = function (browser) {

    this.loggedUserIs = function(user) {
        return browser
          .assert.containsText('.navbar-user', user);
    };

    this.logout = function() {
        browser
          .jqueryClick('.navbar-user a:contains("logout")');

        return browser;
    };
};