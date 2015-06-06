module.exports = {
  before: function (browser, done) {
    browser.globals.startServer(done);
  },

  after: function(browser, done) {
    browser.globals.stopServer(done);
  },

  beforeEach: function(browser) {
    browser
      .url('http://localhost:7890')
      .waitForElementVisible('body', 1000)
      .page.Login().authenticate('admin', 'pwdadmin')
      .page.Sidebar().goToCustomers();
  },

  'Add Customers': function(browser) {
    browser
      .page.Customers().alertContains('No customers to display.')

      .page.Customers().createCustomer({
        name: 'Jeor',
        surname: 'Mormont',
        mobile: '3335544333',
        phone: '055055055'})
      .page.Customers().alertNotPresent()
      .page.Customers().tableCount(1)
      .page.Customers().tableContains(
        0, 'Jeor', 'Mormont', '3335544333 / 055055055')

      .page.Customers().createCustomer({
        name: 'Jon',
        surname: 'Snow'})
      .page.Customers().tableCount(2)
      .page.Customers().tableContains(1, 'Jon', 'Snow')
      .end();
  },

  'Search Customers': function(browser) {
    browser
      .page.Customers().tableCount(2)
      .page.Customers().search('j')
      .page.Customers().tableCount(2)
      .page.Customers().search('j sn')
      .page.Customers().tableCount(1)
      .page.Customers().tableContains(0, 'Jon', 'Snow')
      .page.Customers().resetSearch()
      .page.Customers().tableCount(2)
      .end();
  },

  'Delete Customers': function(browser) {
    browser
      .page.Customers().tableCount(2)

      .page.Customers().deleteCustomer(0)
      .page.Customers().tableContains(0, 'Jon', 'Snow')
      .page.Customers().tableCount(1)

      .page.Customers().deleteCustomer(0)
      .page.Customers().alertContains('No customers to display.')
      .end();
  }
};