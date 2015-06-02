module.exports = {
  before: function (browser, done) {
    browser.globals.startServer(done);
  },

  after : function(browser, done) {
    browser.globals.stopServer(done);
  },

  'Failed Login' : function(browser) {
    browser
      .url('http://localhost:7890/login')
      .waitForElementVisible('body', 1000)
      .page.Login().authenticate('admin', 'wrong')
      .page.Login().alertContains('Incorrect password.')
      .end();
  },

  'Successfully Login' : function(browser) {
    browser
      .url('http://localhost:7890/login')
      .waitForElementVisible('body', 1000)
      .page.Login().authenticate('admin', 'pwdadmin')
      .page.Navbar().loggedUserIs('admin')
      .end();
  }
};