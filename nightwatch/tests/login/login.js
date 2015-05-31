module.exports = {
  before: function (browser, done) {
    browser.globals.startServer(done);
  },

  after : function(browser, done) {
    browser.globals.stopServer(done);
  },

  'Failed Login' : function (browser) {
    browser
      .url('http://localhost:7890/login')
      .waitForElementVisible('body', 1000)
      .page.Login().authenticate('admin', 'wrong')
      .pause(1000)
      .assert.elementPresent('#login-box')
      .assert.elementPresent('.alert-danger')
      .end();
  },

  'Successfully Login' : function (browser) {
    browser
      .url('http://localhost:7890/login')
      .waitForElementVisible('body', 1000)
      .page.Login().authenticate('admin', 'pwdadmin')
      .pause(1000)
      .assert.containsText('.navbar-user', 'admin')
      .end();
  }
};