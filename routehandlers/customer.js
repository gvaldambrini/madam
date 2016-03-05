"use strict";

const common = require('../common');
const client = common.createClient();

 /**
 * The fields of the Customer.
 * @var
 */
const customerFields = [
    'name', 'surname', 'mobile_phone', 'phone', 'email', 'first_seen', 'discount',
    'allow_sms', 'allow_email', 'notes'];


/**
 * Helper class that brings together all the route handlers (declared as static methods)
 * that work on the customer and the utility functions used by them.
 * @class CustomerHandler
 */
class CustomerHandler {

    /**
     * The handler that performs a simple customers search, returning for each customer
     * that matches the searched query string with the name or the surname an object
     * of the form: {id, name, surname}.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static simpleSearch(req, res, _next) {
        if (typeof req.query.text === 'undefined') {
            res.sendStatus(400);
            return;
        }

        let queryBody;
        if (req.query.text.trim()) {
            queryBody = {
                query: {
                    multi_match: {
                        query: req.query.text,
                        operator: 'and',
                        type: 'cross_fields',
                        fields: [
                            "name.autocomplete",
                            "surname.autocomplete"
                        ]
                    }
                }
            };
        }
        else {
            queryBody = {
                query: {
                    match_all: {}
                }
            };
        }

        client.search({
            index: req.config.mainIndex,
            type: 'customer',
            size: req.query.size ? req.query.size : 50,
            body: queryBody
        }, function(err, resp, _respcode) {
            const customers = [];
            for (let i = 0; i < resp.hits.hits.length; i++) {
                customers[customers.length] = {
                    id: resp.hits.hits[i]._id,
                    name: resp.hits.hits[i]._source.name,
                    surname: resp.hits.hits[i]._source.surname
                };
            }

            res.json({
                customers: customers
            });
        });
    }

    /**
     * The handler that performs the full customers search, returning for each customer
     * that matches the searched query string with the name, the surname or the phone
     * an object of the form: {id, name, surname, phone, last_seen}.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static search(req, res, _next) {
        if (typeof req.query.text === 'undefined') {
            res.sendStatus(400);
            return;
        }

        let queryBody;
        if (req.query.text.trim()) {
            queryBody = {
                query: {
                    multi_match: {
                        query: req.query.text,
                        operator: 'and',
                        type: 'cross_fields',
                        fields: [
                            "name.autocomplete",
                            "surname.autocomplete",
                            "mobile_phone.partial",
                            "phone.partial"
                        ]
                    }
                },
                highlight: {
                    fields: {
                        '*': {
                            pre_tags: ['<b>'],
                            post_tags: ['</b>']
                        }
                    }
                }
            };
        }
        else {
            queryBody = {
                query: {
                    match_all: {}
                }
            };
        }

        client.search({
            index: req.config.mainIndex,
            type: 'customer',
            size: 50,
            body: queryBody
        },
            (err, resp, _respcode) =>
            res.json({
                customers: CustomerHandler.processElasticsearchResults(req, resp.hits.hits)
            })
        );
    }

    /**
     * Parses the elasticsearch response and returns an array of objects that represent
     * the customers.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} hits the hits from the elasticsearch response.
     */
    static processElasticsearchResults(req, hits) {
        function getField(hit, field, field_type) {
            if (hit.highlight && hit.highlight[field + '.' + field_type])
                return hit.highlight[field + '.' + field_type][0];

            return hit._source[field];
        }

        // sort by name & surname (ascending)
        function sortFn(a, b) {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();

            const aSurname = a.surname ? a.surname.toLowerCase() : '';
            const bSurname = b.surname ? b.surname.toLowerCase() : '';

            if (aName < bName)
                return -1;
            if (aName > bName)
                return 1;

            if (aSurname < bSurname)
                return -1;
            if (aSurname > bSurname)
                return 1;
            return 0;
        }

        const results = [];
        for (let i = 0; i < hits.length; i++) {
            let phone = getField(hits[i], 'phone', 'partial');
            let mobile = getField(hits[i], 'mobile_phone', 'partial');

            let phone_mobile;
            if (phone && mobile)
                phone_mobile = mobile + ' / ' + phone;
            else if (mobile)
                phone_mobile = mobile;
            else if (phone)
                phone_mobile = phone;
            else
                phone_mobile = '-';

            let surname = getField(hits[i], 'surname', 'autocomplete');
            if (!surname)
                surname = '-';

            results[results.length] = {
                id: hits[i]._id,
                name: getField(hits[i], 'name', 'autocomplete'),
                surname: surname,
                phone: phone_mobile,
                last_seen: common.toLocalFormattedDate(req, hits[i]._source.last_seen)
            };
        }

        results.sort(sortFn);
        return results;
    }

    /**
     * Converts the source object to the format used to present the customer data.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} sourceObj the source object originated from the elasticsearch response.
     */
    static toViewFormat(req, sourceObj) {
        const obj = {};
        for (let i = 0; i < customerFields.length; i++) {
            let field = customerFields[i];
            if (sourceObj[field]) {
                if (field === 'first_seen')
                    obj[field] = common.toLocalFormattedDate(req, sourceObj[field]);
                else if (field === 'discount')
                    obj[field] = '' + sourceObj[field];
                else
                    obj[field] = sourceObj[field];
            }
        }
        return obj;
    }

    /**
     * The handler that returns a single customer object identified by the given customer id.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static fetch(req, res, _next) {
        res.json(CustomerHandler.toViewFormat(req, req.customer));
    }

    /**
     * The handler that returns the full details for a customer identified by the given customer id.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static fetchDetails(req, res, _next) {
        res.json(req.customer);
    }


    /**
     * The handler that returns the full details for a list of customers identified by the given id.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static fetchMultiDetails(req, res, _next) {
        if (typeof req.query.ids === 'undefined') {
            res.sendStatus(400);
            return;
        }

        client.mget({
            index: req.config.mainIndex,
            type: 'customer',
            body: {
                ids: req.query.ids.split(',')
            }
        }, function(err, resp, _respcode) {
            res.json(resp.docs.map(el => el._source));
        });
    }

    /**
     * Validates the Customer data and returns the list of the errors if any.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     */
    static validateData(req) {
        // Trim all the fields that allow the user to write text
        for (let i = 0; i < customerFields.length; i++)
            req.sanitize(customerFields[i]).trim();

        req.checkBody('name', req.i18n.__('The name is mandatory')).notEmpty();

        if (!req.body.mobile_phone)
            req.checkBody(
                'allow_sms', req.i18n.__(
                    'To set allow sms, you must specify a mobile phone')).optional().isEmpty();

        if (!req.body.email) {
            req.checkBody('allow_email', req.i18n.__(
                'To set allow email, you must specify an email')).optional().isEmpty();
        }
        else {
            req.checkBody('email', req.i18n.__(
                'The email does not seem a valid email')).isEmail();
        }

        if (req.body.first_seen) {
            req.checkBody('first_seen', req.i18n.__(
                'The first date seen does not seem a valid date')).isValidDate();
        }

        return req.validationErrors();
    }

    /**
     * Converts the source object to the format used to save the related document
     * on elasticsearch.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} sourceObj the source object originated from the frontend.
     */
    static toElasticsearchFormat(req, sourceObj) {
        const obj = {};
        for (let i = 0; i < customerFields.length; i++) {
            let field = customerFields[i];
            if (sourceObj[field]) {
                if (field === 'first_seen')
                    obj[field] = common.toISODate(req, sourceObj[field]);
                else if (field === 'allow_sms' || field === 'allow_email')
                    obj[field] = sourceObj[field] === "true";
                else if (field === 'discount')
                    obj[field] = parseInt(sourceObj[field], 10);
                else
                    obj[field] = sourceObj[field];
            }
        }
        return obj;
    }

    /**
     * The handler that creates a customer object from the data passed in the request body.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static create(req, res, _next) {
        const errors = CustomerHandler.validateData(req);
        if (errors) {
            res.status(400).json({errors: errors});
            return;
        }

        const customerObj = CustomerHandler.toElasticsearchFormat(req, req.body);

        function findAppointmentDate(resp, appid) {
            if (resp.found && resp._source.days.length > 0) {
                let calDays = resp._source.days;
                for (let i = 0; i < calDays.length; i++) {
                    for (let j = 0; j < calDays[i].planned_appointments.length; j++) {
                        if (calDays[i].planned_appointments[j].appid === appid) {
                            return {
                                dateIndex: i,
                                appIndex: j
                            };
                        }
                    }
                }
            }
        }

        if (typeof req.body.__appid !== 'undefined') {
            client.get({
                index: req.config.mainIndex,
                type: 'calendar',
                id: common.calendarDocId
            }, function(err, resp, _respcode) {
                const indices = findAppointmentDate(resp, req.body.__appid);
                if (typeof indices === 'undefined') {
                    res.sendStatus(404);
                    return;
                }
                const calendarObj = resp._source;
                customerObj.planned_appointments = [{
                    appid: req.body.__appid,
                    date: calendarObj.days[indices.dateIndex].date
                }];

                calendarObj.days[indices.dateIndex].planned_appointments.splice(indices.appIndex, 1);
                client.bulk({
                    body: [
                        {index: {_index: req.config.mainIndex, _type: 'customer'}},
                        customerObj,
                        {index: {_index: req.config.mainIndex, _type: 'calendar', _id: common.calendarDocId}},
                        calendarObj
                    ],
                    refresh: true
                }, (err, resp, _respcode) =>
                   common.saveCallback(req, res, err, resp, true, {id: resp.items[0].create._id})
                );
            });
        }
        else {
            const args = {
                index: req.config.mainIndex,
                type: 'customer',
                refresh: true,
                body: customerObj
            };

            client.index(args,
                (err, resp, _respcode) =>
                common.saveCallback(req, res, err, resp, true)
            );
        }
    }

    /**
     * The handler that updates a customer object from the data passed in the request body.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static update(req, res, _next) {
        const errors = CustomerHandler.validateData(req);
        if (errors) {
            res.status(400).json({errors: errors});
            return;
        }

        const args = {
            index: req.config.mainIndex,
            type: 'customer',
            id: req.params.id,
            refresh: true,
            body: CustomerHandler.toElasticsearchFormat(req, req.body)
        };

        args.body.appointments = req.customer.appointments;
        args.body.last_seen = req.customer.last_seen;
        args.body.planned_appointments = req.customer.planned_appointments;
        client.index(args,
            (err, resp, _respcode) =>
            common.saveCallback(req, res, err, resp, false)
        );
    }

    /**
     * The handler that deletes a customer object identified by the given id.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static delete(req, res, _next) {
        client.delete({
            index: req.config.mainIndex,
            type: 'customer',
            refresh: true,
            id: req.params.id
        }, function(err, resp, _respcode) {
            if (err) {
                console.log(err);
                res.status(400).end();
            }
            else {
                res.status(200).end();
            }
        });
    }
}

module.exports = CustomerHandler;