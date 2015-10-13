module.exports = {
  before: function(browser, done) {
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
      .page.Sidebar().goToSettings()
      .page.Workers().goToServices();
  },

  'Create services': function(browser) {
    browser
      .pause(100)
      .page.Services().count(1)
      .page.Services().enableEdit()
      .page.Services().save()
      .page.Services().alertContains('At least one service is mandatory')
      .page.Services().set(0, 'shampoo')
      .page.Services().add()
      .page.Services().set(1, 'haircut')
      .page.Services().count(2)
      .page.Services().add()
      .page.Services().set(2, 'color')
      .page.Services().save()
      .end();
  },

  'Update services': function(browser) {
    browser
      .page.Services().count(3)
      .page.Services().enableEdit()
      .page.Services().expected(0, 'shampoo')
      .page.Services().expected(1, 'haircut')
      .page.Services().expected(2, 'color')
      .page.Services().set(0, '')
      .page.Services().remove(2)
      .page.Services().save()

      .page.Services().enableEdit()
      .page.Services().count(1)
      .page.Services().add()
      .page.Services().set(1, 'permanent')
      .page.Services().save()

      .page.Services().count(2)
      .page.Services().expected(0, 'haircut')
      .page.Services().expected(1, 'permanent')
      .end();
  }

};