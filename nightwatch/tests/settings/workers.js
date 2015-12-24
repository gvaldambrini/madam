module.exports = {
  beforeEach: function(browser) {
    browser
      .url('http://localhost:7890')
      .waitForElementVisible('body', 1000)
      .page.Login().authenticate('admin', 'pwdadmin')
      .page.Sidebar().goToSettings();
  },

  'Create workers': function(browser) {
    browser
      .page.Workers().count(1)
      .page.Workers().enableEdit()
      .page.Workers().set(0, {name: 'Cersei', color: '#ffd700'})
      .page.Workers().add()
      .page.Workers().set(1, {name: 'Daenerys', color: '#ff0000'})
      .page.Workers().save()
      .page.Workers().count(2)
      .end();
  },

  'Update workers': function(browser) {
    browser
      .page.Workers().count(2)
      .page.Workers().enableEdit()
      .page.Workers().expected(0, {name: 'Cersei', color: '#ffd700'})
      .page.Workers().expected(1, {name: 'Daenerys', color: '#ff0000'})
      .page.Workers().set(0, {name: 'Cersei', color: '#fdd017'})
      .page.Workers().remove(1)
      .page.Workers().count(1)
      .page.Workers().add()
      .page.Workers().set(1, {name: 'Brienne', color: '#2554c7'})
      .page.Workers().add()
      .page.Workers().set(2, {name: 'Margaery', color: '#4dbd33'})
      .page.Workers().save()
      .end();
  },

  'Delete workers': function(browser) {
    browser
      .page.Workers().count(3)
      .page.Workers().enableEdit()
      .page.Workers().expected(0, {name: 'Cersei', color: '#fdd017'})
      .page.Workers().expected(1, {name: 'Brienne', color: '#2554c7'})
      .page.Workers().expected(2, {name: 'Margaery', color: '#4dbd33'})
      .page.Workers().remove(1)
      .page.Workers().count(2)
      .page.Workers().expected(0, {name: 'Cersei', color: '#fdd017'})
      .page.Workers().expected(1, {name: 'Margaery', color: '#4dbd33'})
      // set an empty name acts as a delete
      .page.Workers().set(0, {name: '', color: '#fdd017'})
      .page.Workers().save()
      .end();
  },

  'Last worker cannot be deleted': function(browser) {
    browser
      .page.Workers().count(1)
      .page.Workers().enableEdit()
      .page.Workers().expected(0, {name: 'Margaery', color: '#4dbd33'})
      .page.Workers().set(0, {name: '', color: '#fdd017'})
      .page.Workers().save()
      .page.Workers().alertContains('At least one worker is mandatory')
      .end();
  }
};