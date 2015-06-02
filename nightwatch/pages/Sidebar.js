module.exports = function (browser) {
    this.goToCustomers = function() {
        browser
          .waitForElementVisible('.nav-sidebar', 1000)
          .jqueryClick('.nav-sidebar a:contains("Customers")');

        return browser;
    };

    this.goToSettings = function() {
        browser
          .waitForElementVisible('.nav-sidebar', 1000)
          .jqueryClick('.nav-sidebar a:contains("Settings")');

        return browser;
    };
};