module.exports = function (browser) {

    this.submit = function() {
        return browser.click('button[name=submit]');
    };

    this.alertContains = function(message) {
        return browser
          .waitForElementVisible('.alert', 1000)
          .assert.containsText('.alert', message);
    };

    this.toggleService = function(index) {
        return browser.execute(function(index) {
            $('#form .service:eq(' + index + ') input[type=checkbox]').click();
        }, [index]);
    };

    this.addService = function() {
        return browser
          .waitForElementVisible('#form .btn-add', 1000)
          .click('#form .btn-add');
    };

    this.setService = function(index, name) {
        return browser.execute(function(index, name) {
            $('#form .service:eq(' + index + ') input[type=text]').val(name);
        }, [index, name]);
    };

    this.switchWorker = function(index) {
        return browser.execute(function(index) {
            $('#form .service:eq(' + index + ') .btn-click').click();
        }, [index]);
    };

    this.selectWorker = function(index, worker) {
        return browser.execute(function(index, worker) {
            var service = $('#form .service:eq(' + index + ')');
            service.find('.dropdown-toggle').click();
            service.find('.dropdown-menu a:contains("' + worker + '")').click();
        }, [index, worker]);
    };

    this.expectedWorker = function(index, worker) {
        return browser.execute(function(index) {
            return $('#form .service:eq(' + index + ') .btn-click').text();
        }, [index], function(result) {
            browser.assert.equal(result.value, worker);
        });
    };
};