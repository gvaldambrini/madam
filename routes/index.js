"use strict";

/**
 * Index module, contains all the homepage and the login/logout views.
 * @module
 */
const express = require('express');
const passport = require('passport');
const router = express.Router();
const common = require('../common');

router.get('*', function(req, res, next) {
    if (req.xhr) {
        return next();
    }
    res.render('single', {
        i18n: {
            title: req.i18n.__('MadamPettine'),
            logout: req.i18n.__('logout'),
            sidebar: {
                home: req.i18n.__('Home'),
                customers: req.i18n.__('Customers'),
                products: req.i18n.__('Products'),
                settings: req.i18n.__('Settings')
            },
            customers: {
                search: req.i18n.__('Search...'),
                createNew: req.i18n.__('Create new customer'),
                edit: req.i18n.__('Edit customer'),
                emptyTableMsg: req.i18n.__('No customers to display.'),
                submitAndAdd: req.i18n.__('Create customer and appointment'),
                mandatoryFields: req.i18n.__('Fields marked with <span class="mandatory">*</span> are mandatory.'),
                name: req.i18n.__('Name'),
                surname: req.i18n.__('Surname'),
                phones: req.i18n.__('Mobile') + ' / ' + req.i18n.__('Phone'),
                lastSeen: req.i18n.__('Last seen'),
                mobilePhone: req.i18n.__('Mobile Phone'),
                allowSms: req.i18n.__('Allow sms'),
                phone: req.i18n.__('Phone'),
                email: req.i18n.__('Email'),
                allowEmail: req.i18n.__('Allow email'),
                firstSeen: req.i18n.__('First seen'),
                discount: req.i18n.__('Discount'),
                notes: req.i18n.__('Notes'),
                headerInfo: req.i18n.__('Info'),
                headerAppointments: req.i18n.__('Appointments'),
                deleteText: req.i18n.__('Delete customer'),
                deleteTitle: req.i18n.__('Delete the customer?'),
                deleteMsg: req.i18n.__('The operation cannot be undone. Continue?'),
                btnConfirm: req.i18n.__('Confirm'),
                btnCancel: req.i18n.__('Cancel'),
                submitAdd: req.i18n.__('Create customer'),
                submitEdit: req.i18n.__('Edit customer')
            },
            appointments: {
                date: req.i18n.__('Date'),
                services: req.i18n.__('Services'),
                createNew: req.i18n.__('Create new appointment'),
                btnConfirm: req.i18n.__('Confirm'),
                btnCancel: req.i18n.__('Cancel'),
                deleteText: req.i18n.__('Delete appointment'),
                deleteTitle: req.i18n.__('Delete the appointment?'),
                deleteMsg: req.i18n.__('The operation cannot be undone. Continue?'),
                titleNew: req.i18n.__('New appointment'),
                titleEdit: req.i18n.__('Edit appointment'),
                submitAdd: req.i18n.__('Create appointment'),
                submitEdit: req.i18n.__('Edit appointment'),
                notes: req.i18n.__('Notes'),
                addService: req.i18n.__('Add service'),
                setWorkersMsg: req.i18n.__(
                    'To create an appointment, you have first to define the workers.'),
                setServicesMsg: req.i18n.__(
                    'To create an appointment, you have first to define the common services.')
            },
            products: {
                addNew: req.i18n.__('Add product'),
                cloneText: req.i18n.__('Add another'),
                edit: req.i18n.__('Edit product'),
                search: req.i18n.__('Search...'),
                emptyTableMsg: req.i18n.__('No products to display.'),
                btnConfirm: req.i18n.__('Confirm'),
                btnCancel: req.i18n.__('Cancel'),
                deleteText: req.i18n.__('Delete product'),
                deleteTitle: req.i18n.__('Delete the product?'),
                deleteMsg: req.i18n.__('The operation cannot be undone. Continue?'),
                name: req.i18n.__('Name'),
                brand: req.i18n.__('Brand'),
                soldCount: req.i18n.__('Sold'),
                soldDate: req.i18n.__('Sold date'),
                notes: req.i18n.__('Notes'),
                submitAdd: req.i18n.__('Add product'),
                submitEdit: req.i18n.__('Edit product'),
                mandatoryFields: req.i18n.__('Fields marked with <span class="mandatory">*</span> are mandatory.')
            },
            settings: {
                workersName: req.i18n.__('Workers'),
                servicesName: req.i18n.__('Services'),
                workers: {
                    title: req.i18n.__('Set workers'),
                    name: req.i18n.__('Name'),
                    unlock: req.i18n.__('Unlock'),
                    save: req.i18n.__('Save workers')
                },
                services: {
                    title: req.i18n.__('Set services'),
                    name: req.i18n.__('Name'),
                    unlock: req.i18n.__('Unlock'),
                    save: req.i18n.__('Save services')
                }
            },
            login: {
                username: req.i18n.__('Username'),
                password: req.i18n.__('Password'),
                submitText: req.i18n.__('Login'),
                boxTitle: req.i18n.__('Login')
            },
            homepage: {
                planAppointment: req.i18n.__('Plan appointment for:'),
                plan: req.i18n.__('Add'),
                customerPlaceholder: req.i18n.__('Insert a new customer or select an existing one'),
                planned: req.i18n.__('Planned'),
                appointments: req.i18n.__('Appointments'),
                btnConfirm: req.i18n.__('Confirm'),
                btnCancel: req.i18n.__('Cancel'),
                deleteTitle: req.i18n.__('Delete the appointment?'),
                deleteMsg: req.i18n.__('The operation cannot be undone. Continue?'),
                deleteText: req.i18n.__('Delete appointment')
            }
        }
    });
});

router.post('/login', function(req, res, next) {
    passport.authenticate('login', function(err, user, info) {
        if (!user) {
            if (typeof info !== 'undefined' && info.message === 'Missing credentials') {
                // The verify callback (the function passed as second argument to the LocalStrategy
                // class) is not called if the username or the password is missing. Instead,
                // the returned error is null, the username false but the info is equal to the
                // standard string 'Missing credentials', which is the one used here to provide
                // a meaningful message to the frontend.
                err = req.i18n.__(req.body.username  ? 'Missing password.' : 'Missing username.');
                res.status(400).json({errors: [{msg: err}]});
                return;
            }

            res.status(401).json({errors: [{msg: err}]});
            return;
        }

        req.logIn(user, function(err) {
            if (err) {
                return next(err);
            }
            res.status(200).json({user: user});
        });
    })(req, res, next);
});

router.post('/logout', function(req, res, next) {
  req.logout();
  res.status(200).end();
});

/** The index router. */
module.exports = router;
