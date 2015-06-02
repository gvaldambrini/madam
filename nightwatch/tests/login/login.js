module.exports = {
  before: function (browser, done) {
    browser.globals.startServer(done);
  },

  after : function(browser, done) {
    browser.globals.stopServer(done);
  },

  'Failed Login' : function(browser) {
    browser
      .url('http://localhost:7890')
      .page.Login().authenticate('admin', 'wrong')
      .page.Login().alertContains('Incorrect password.')
      .page.Login().authenticate('admina', 'pwdadmin')
      .page.Login().alertContains('Incorrect username.')
      .end();
  },

  'Successfully Login' : function(browser) {
    browser
      .url('http://localhost:7890')
      .page.Login().authenticate('admin', 'pwdadmin')
      .page.Navbar().loggedUserIs('admin')
      .end();
  },

  'Logout': function(browser) {
    browser
      .url('http://localhost:7890')
      .page.Login().authenticate('admin', 'pwdadmin')
      .page.Navbar().logout()
      .page.Login().isLoginPage()
      .end();
  }
};