var field_map = {
    name: 'name',
    brand: 'brand',
    sold_date: 'sold_date',
    notes: 'notes'
};

module.exports = function (browser) {

    this.fillForm = function(obj) {
        browser.waitForElementVisible('form', 1000);
        for (var prop in obj) {
            if (prop == 'sold_date') {
                browser.execute(function(date) {
                    $('input[name=sold_date]').datepicker('setDate', date);
                }, [obj[prop]]);
            }
            else if (prop == 'notes') {
                browser
                  .clearValue('textarea[name=' + field_map[prop] + ']')
                  .setValue('textarea[name=' + field_map[prop] + ']', obj[prop]);
            }
            else {
                browser
                  .clearValue('input[name=' + field_map[prop] + ']')
                  .setValue('input[name=' + field_map[prop] + ']', obj[prop]);
            }
        }
        return browser;
    };

    this.expectedFields = function(obj) {

        for (var prop in obj) {
            browser.assert.value('input[name=' + field_map[prop] + ']', obj[prop]);
        }
        return browser;
    };

    this.submit = function() {
        return browser.click('button[name=submit]');
    };
};