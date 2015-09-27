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
      .page.Sidebar().goToProducts();
  },

  'Add products': function(browser) {
    browser
      .page.Products().alertContains('No products to display.')

      .page.Products().addProduct()
      .page.Product().fillForm({
        name: 'shampoo',
        brand: 'oreal'})
      .page.Product().submit()
      .page.Products().alertNotPresent()
      .page.Products().tableCount(1)
      .page.Products().tableContains(0, 'shampoo', 'oreal', '1')
      .page.Products().nestedTableCount(0, 1)

      .page.Products().addProduct()
      .page.Product().fillForm({
        name: 'shampoo',
        brand: 'wella',
        sold_date: '18/09/2015',
        notes: 'first'})
      .page.Product().submit()
      .page.Products().tableCount(2)
      .page.Products().tableContains(1, 'shampoo', 'wella', '1')
      .page.Products().nestedTableCount(1, 1)

      .page.Products().addProduct()
      .page.Product().fillForm({
        name: 'shampoo',
        brand: 'wella',
        sold_date: '15/09/2015',
        notes: 'second'})
      .page.Product().submit()
      .page.Products().tableCount(2)
      .page.Products().tableContains(0, 'shampoo', 'wella', '2')
      .page.Products().nestedTableCount(0, 2)
      .page.Products().tableContains(1, 'shampoo', 'oreal', '1')
      .page.Products().nestedTableCount(1, 1)

      .page.Products().copyProduct(0)
      .page.Product().fillForm({
        name: 'shampoo',
        brand: 'wella',
        sold_date: '15/09/2015',
        notes: 'third'})
      .page.Product().submit()
      .page.Products().tableCount(2)
      .page.Products().tableContains(0, 'shampoo', 'wella', '3')
      .page.Products().nestedTableCount(0, 3)
      .page.Products().tableContains(1, 'shampoo', 'oreal', '1')
      .end();
  },

  'Search products': function(browser) {
    browser
      .page.Products().tableCount(2)
      .page.Products().search('sham')
      .page.Products().tableCount(2)
      .page.Products().search('sham or')
      .page.Products().tableCount(1)
      .page.Products().tableContains(0, 'shampoo', 'oreal', '1')
      .page.Products().resetSearch()
      .page.Products().tableCount(2)
      .end();
  },

  'Edit a product': function(browser) {
    browser
      .page.Products().toggleNestedTable(0)
      .page.Products().nestedTableContains(0, 0, '18/09/2015', 'first')
      .page.Products().nestedTableContains(0, 1, '15/09/2015', 'second')
      .page.Products().nestedTableContains(0, 2, '15/09/2015', 'third')
      .page.Products().editProduct(0, 2)
      .page.Product().fillForm({
        name: 'shampoo',
        brand: 'wella',
        sold_date: '15/09/2015',
        notes: 'third - else'})
      .page.Product().submit()
      .page.Products().toggleNestedTable(0)
      .page.Products().nestedTableCount(0, 3)
      .page.Products().nestedTableContains(0, 0, '18/09/2015', 'first')
      .page.Products().nestedTableContains(0, 1, '15/09/2015', 'second')
      .page.Products().nestedTableContains(0, 2, '15/09/2015', 'third - else')
      .end();
  },

  'Delete products': function(browser) {
    browser
      .page.Products().nestedTableCount(0, 3)

      .page.Products().toggleNestedTable(0)
      .page.Products().deleteProduct(0, 0)

      .page.Products().tableCount(2)
      .page.Products().nestedTableCount(0, 2)
      .page.Products().toggleNestedTable(0)
      .page.Products().nestedTableContains(0, 0, '15/09/2015', 'second')
      .page.Products().nestedTableContains(0, 1, '15/09/2015', 'third - else')
      .page.Products().toggleNestedTable(0)

      .page.Products().toggleNestedTable(1)
      .page.Products().nestedTableCount(1, 1)
      .page.Products().deleteProduct(1, 0)

      .page.Products().tableCount(1)
      .end();
  }
};