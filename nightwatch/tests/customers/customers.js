module.exports = {
  before: function (browser, done) {
    browser.globals.startServer(done);
  },

  after : function(browser, done) {
    browser.globals.stopServer(done);
  },

  'Customers' : function(browser) {
    browser
      .url('http://localhost:7890')
      .waitForElementVisible('body', 1000)
      .page.Login().authenticate('admin', 'pwdadmin')
      .page.Sidebar().goToCustomers()
      .page.Customers().alertContains('No customers to display.')
      .page.Customers().createCustomer('john', 'doe')
      .page.Customers().alertNotPresent()
      .page.Customers().tablePresent()
      .page.Customers().tableContains(0, 'john', 'doe')
      .end();
  }
};