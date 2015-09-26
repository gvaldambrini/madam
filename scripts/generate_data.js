#!/usr/bin/env node

(function() {
    var async = require('async');
    var fs = require('fs');
    var path = require('path');
    var elasticsearch = require('elasticsearch');
    var common = require('../common');
    var client = common.createClient();

    var mainIndex = 'main';

    function rainbow(numOfSteps, step) {
        // This function generates vibrant, "evenly spaced" colours (i.e. no clustering).
        // This is ideal for creating easily distinguishable vibrant markers in Google Maps
        // and other apps.
        // Adam Cole, 2011-Sept-14
        // HSV to RBG adapted from: http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
        var r, g, b;
        var h = step / numOfSteps;
        var i = ~~(h * 6);
        var f = h * 6 - i;
        var q = 1 - f;
        switch(i % 6){
            case 0: r = 1; g = f; b = 0; break;
            case 1: r = q; g = 1; b = 0; break;
            case 2: r = 0; g = 1; b = f; break;
            case 3: r = 0; g = q; b = 1; break;
            case 4: r = f; g = 0; b = 1; break;
            case 5: r = 1; g = 0; b = q; break;
        }
        var c = "#" + ("00" + (~ ~(r * 255)).toString(16)).slice(-2) +
            ("00" + (~ ~(g * 255)).toString(16)).slice(-2) +
            ("00" + (~ ~(b * 255)).toString(16)).slice(-2);
        return (c);
    }

    function getRandomElement(container) {
        return container[Math.floor(Math.random() * container.length)];
    }

    function readFileAsArray(filename) {
        var data = fs.readFileSync(filename, 'UTF-8');
        return data.split('\n');
    }

    function populateCustomers(num) {
        var lastnames = readFileAsArray(path.join(__dirname, 'data', 'lastnames.txt'));
        var firstnames = readFileAsArray(path.join(__dirname, 'data', 'firstnames.txt'));
        var body = [];

        for (var i = 0; i < num; i++) {
            body[body.length] = {index: {_index: mainIndex, _type: 'customer'}};

            body[body.length] = {
                name: getRandomElement(firstnames),
                surname: getRandomElement(lastnames)
            };
        }
        client.bulk({body: body});
    }

    function populateSettings() {
        var body = [];

        // Workers
        var numWorkers = 4;
        var firstnames = readFileAsArray(path.join(__dirname, 'data', 'firstnames.txt'));

        body[body.length] = {index: {_index: mainIndex, _type: 'workers', _id: common.workersDocId}};
        var workers = [];

        for (var i = 0; i < numWorkers; i++) {
            workers[workers.length] = {
                name: getRandomElement(firstnames),
                color: rainbow(numWorkers, i)
            };
        }
        body[body.length] = {workers: workers};

        // Services
        body[body.length] = {index: {_index: mainIndex, _type: 'services', _id: common.servicesDocId}};
        body[body.length] = {
            names: ['shampoo', 'conditioning', 'haircut', 'color', 'highlights']
        };

        client.bulk({body: body});
    }

    module.exports = {
        populateSettings: populateSettings,
        populateCustomers: populateCustomers
    };

    if (!module.parent) {
        populateSettings();
        populateCustomers(10);
    }
}
)();