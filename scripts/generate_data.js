#!/usr/bin/env node

"use strict";

/**
 * @overview Generates demo content for all the document types managed by
 * the application to make it easy testing the app with some content.
 */

const fs = require('fs');
const path = require('path');
const moment = require('moment');
const bcrypt = require('bcrypt-nodejs');
const uuid = require('node-uuid');
const common = require('../common');
const client = common.createClient();


(function() {
    const mainIndex = 'main';
    const workers = [];

    // The services that will be created
    const services = ['shampoo', 'conditioning', 'haircut', 'color', 'highlights'];

    // The number of workers generated
    const numWorkers = 4;

    // The minimum number of appointments generated for each customer
    const minApp = 0;
    const maxApp = 5;

    // The minimum number of planned appointments generated for each customer
    const minPlannedApp = 0;
    const maxPlannedApp = 2;

    // The number of customers generated
    const numCustomers = 20;

    // The number of products created
    const numProducts = 30;

    // Username and password of the created user.
    const username = "admin";
    const password = "madam";

    function rainbow(numOfSteps, step) {
        /*eslint-disable no-var*/
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
        /*eslint-enable no-var*/
    }

    function getRandomElement(container) {
        return container[Math.floor(Math.random() * container.length)];
    }

    function popRandomElement(container) {
        const element = getRandomElement(container);
        const index = container.indexOf(element);
        container.splice(index, 1);
        return element;
    }

    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function readFileAsArray(filename) {
        const data = fs.readFileSync(filename, 'UTF-8');
        return data.split('\n');
    }

    function populateCustomers() {
        console.log('Populate customers...');
        const lastnames = readFileAsArray(path.join(__dirname, 'data', 'lastnames.txt'));
        const firstnames = readFileAsArray(path.join(__dirname, 'data', 'firstnames.txt'));
        const body = [];

        for (let i = 0; i < numCustomers; i++) {
            body[body.length] = {index: {_index: mainIndex, _type: 'customer'}};

            const appointments = [];
            let offset = getRandomInt(0, 3);
            const initialOffset = offset;
            for (let j = 0; j < getRandomInt(minApp, maxApp); j++) {
                const appServices = [];
                const serviceNames = services.slice();

                for (let k = 0; k < getRandomInt(Math.floor(services.length / 2), services.length); k++) {
                    appServices[appServices.length] = {
                        description: popRandomElement(serviceNames),
                        worker: getRandomElement(workers).name
                    };
                }

                appointments[appointments.length] = {
                    appid: uuid.v4(),
                    date: moment().subtract(offset, 'days').format('YYYY-MM-DD'),
                    services: appServices
                };
                offset += getRandomInt(2, 8);
            }

            offset = getRandomInt(0, 3);
            if (initialOffset === 0 && offset === 0) {
                // we cannot have an appointment and a planned one on the same day.
                offset = 1;
            }
            const planned_appointments = [];
            for (let k = 0; k < getRandomInt(minPlannedApp, maxPlannedApp); k++) {
                planned_appointments[planned_appointments.length] = {
                    appid: uuid.v4(),
                    date: moment().add(offset, 'days').format('YYYY-MM-DD')
                };
                offset += getRandomInt(4, 7);
            }

            const customer = {
                name: getRandomElement(firstnames),
                surname: getRandomElement(lastnames),
                appointments: appointments,
                planned_appointments: planned_appointments
            };

            if (appointments.length > 0)
                customer.last_seen = appointments[0].date;
            body[body.length] = customer;
        }
        client.bulk({body: body});
    }

    function populateProducts() {
        console.log('Populate products...');
        const products = ['shampoo', 'hairspray', 'argan oil', 'hair protection',
            'conditioner', 'color protect shampoo', 'gel', 'ultra defining gel',
            'volume mousse', 'silk therapy', 'scalp treatment', 'cure restorative masque',
            'hair booster'];
        const brands = ['kenra', 'wella', 'matrix', 'redken', 'oreal', 'pureology'];
        const body = [];

        for (let i = 0; i < numProducts; i++) {
            body[body.length] = {index: {_index: mainIndex, _type: 'product'}};
            const product = {
                name: getRandomElement(products),
                brand: getRandomElement(brands),
                sold_date: moment().subtract(getRandomInt(0, 30), 'days').format('YYYY-MM-DD'),
                created_at: new Date().toISOString()
            };

            product.complete_name = product.name;
            if (product.brand) {
                product.complete_name += product.brand;
            }
            body[body.length] = product;
        }
        client.bulk({body: body});
    }

    function populateSettings() {
        console.log('Populate settings...');
        const body = [];

        // Workers
        const firstnames = readFileAsArray(path.join(__dirname, 'data', 'firstnames.txt'));
        body[body.length] = {index: {_index: mainIndex, _type: 'workers', _id: common.workersDocId}};
        for (let i = 0; i < numWorkers; i++) {
            workers[workers.length] = {
                name: getRandomElement(firstnames),
                color: rainbow(numWorkers, i)
            };
        }
        body[body.length] = {workers: workers};

        // Services
        body[body.length] = {index: {_index: mainIndex, _type: 'services', _id: common.servicesDocId}};
        body[body.length] = {names: services};
        client.bulk({body: body});
    }

    function populateCalendar() {
        console.log('Populate calendar...');
        const body = [];
        const lastnames = readFileAsArray(path.join(__dirname, 'data', 'lastnames.txt'));
        const firstnames = readFileAsArray(path.join(__dirname, 'data', 'firstnames.txt'));

        body[body.length] = {index: {_index: mainIndex, _type: 'calendar', _id: common.calendarDocId}};

        const calendarDays = [];
        const numDays = 3;
        let offset = getRandomInt(-3, 3);

        for (let i = 0; i < numDays; i++) {
            const plannedApp = [];
            for (let j = 0; j < getRandomInt(1, 3); j++) {
                plannedApp[plannedApp.length] = {
                    appid: uuid.v4(),
                    fullname: getRandomElement(firstnames) + ' ' + getRandomElement(lastnames)
                };
            }
            calendarDays[calendarDays.length] = {
                date: moment().add(offset, 'days').format('YYYY-MM-DD'),
                planned_appointments: plannedApp
            };
            offset += getRandomInt(1, 4);
        }
        body[body.length] = {days: calendarDays};
        client.bulk({body: body});
    }

    function createUser() {
        console.log('Create user...');
        const body = [];

        const user = {
            username: username,
            password: bcrypt.hashSync(password, bcrypt.genSaltSync(10))
        };

        body[body.length] = {index: {_index: mainIndex, _type: 'users', _id: common.usersDocId}};
        body[body.length] = {users: [user]};
        client.bulk({body: body});
    }

    module.exports = {
        populateSettings: populateSettings,
        populateCustomers: populateCustomers,
        populateProducts: populateProducts
    };

    if (!module.parent) {
        populateSettings();
        populateCustomers();
        populateProducts();
        populateCalendar();
        createUser();
    }
}
)();