module.exports = function (browser) {

    this.addProduct = function() {
        return browser
          .waitForElementVisible('.main .btn-primary', 1000)
          .click('.main .btn-primary');
    };

    this.copyProduct = function(index) {
      return browser.execute(function(index) {
          $('tbody tr[data-toggle]:eq(' + index + ') span.glyphicon-plus').click();
      }, [index]);
    };

    this.toggleNestedTable = function(index) {
      return browser.execute(function(index) {
          $('tbody tr[data-toggle]:eq(' + index + ')').click();
      }, [index]);
    };

    this.nestedTableCount = function(index, count) {
      return browser.execute(function(index) {
          return $('tbody .hidden-row:eq(' + index + ') tbody tr').length;
      }, [index], function(result) {
          browser.assert.equal(
            result.value, count, 'Test the nested table length');
      });
    };

    this.nestedTableContains = function(main_index, sec_index, sold_date, notes) {
        return browser.execute(function(main_index, sec_index) {
            var row = $('tbody .hidden-row:eq(' + main_index +
              ') tbody tr:eq('+ sec_index +')');

            return {
              sold_date: row.find('td:eq(0)').text(),
              notes: row.find('td:eq(1)').text()
            };
        }, [main_index, sec_index], function(result) {
            browser.assert.equal(result.value.sold_date, sold_date, 'Test the product sold date');
            browser.assert.equal(result.value.notes, notes || '', 'Test the product notes');
        });
    };

    this.editProduct = function(main_index, sec_index) {
      browser.execute(function(main_index, sec_index) {
          $('tbody .hidden-row:eq(' + main_index +
            ') tbody tr:eq(' + sec_index + ')').click();
      }, [main_index, sec_index]);
      return browser;
    };

    this.deleteProduct = function(main_index, sec_index) {
      browser.execute(function(main_index, sec_index) {
          $('tbody .hidden-row:eq(' + main_index +
            ') tbody tr:eq(' + sec_index +
            ') span.glyphicon-trash').click();
      }, [main_index, sec_index]);

      browser
        .waitForElementVisible('#popovers-container button.btn-confirm', 1000)
        .click('#popovers-container button.btn-confirm');

      return browser;
    };

    this.alertContains = function(message) {
        return browser
          .waitForElementVisible('#products-table-container .alert', 1000)
          .assert.containsText('#products-table-container .alert', message);
    };

    this.alertNotPresent = function() {
        return browser
          .assert.elementNotPresent('#products-table-container .alert');
    };

    this.tableContains = function(index, name, brand, sold) {
        return browser.execute(function(index) {
            var row = $('tbody tr[data-toggle]:eq(' + index + ')');
            return {
              name: row.find('td:eq(0)').text(),
              brand: row.find('td:eq(1)').text(),
              sold: row.find('td:eq(2)').text()
            };
        }, [index], function(result) {
            browser.assert.equal(result.value.name, name, 'Test the product name');
            browser.assert.equal(result.value.brand, brand || '', 'Test the product brand');
            browser.assert.equal(result.value.sold, sold || '', 'Test how many products sold');
        });
    };

    this.tableCount = function(count) {
        browser.execute(function() {
            return $('tbody tr[data-toggle]').length;
        }, [], function(result) {
            browser.assert.equal(result.value, count, 'Test the table length');
        });

      return browser;
    };

    this.search = function(text) {
        browser.clearValue('#search-input');
        // ugly hack to workaround the fact that the setValue for the search
        // input field does not trigger the keyboard events needed to update
        // the results.
        for (var i = 0; i < text.length; i++) {
          browser
            .setValue('#search-input', text[i]);
        }

        return browser;
    };

    this.resetSearch = function() {
      return browser.click('#search-clear');
    };
};