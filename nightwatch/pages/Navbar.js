module.exports = function (browser) {

    this.loggedUserIs = function(user) {
        return browser
          .assert.containsText('.navbar-user', user);
    };
};