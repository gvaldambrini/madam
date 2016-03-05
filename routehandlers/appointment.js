"use strict";

const async = require('async');
const moment = require('moment');
const uuid = require('node-uuid');

const common = require('../common');
const client = common.createClient();


/**
 * Helper class that brings together all the route handlers (declared as static methods)
 * that work on appointment and the utility functions used by them.
 * @class AppointmentHandler
 */
class AppointmentHandler {

  /**
   * The handler that returns all the appointments for the given date.
   * @method
   *
   * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
   * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
   * @param {function} _next the next middleware function to invoke, if any.
   */
  static fetchByDate(req, res, _next) {
    function getApps(callback) {
      const queryBody = {
        query: {
          bool: {
            must: { term: { 'customer.appointments.date': req.params.date }}
          }
        }
      };

      client.search({
        index: req.config.mainIndex,
        type: 'customer',
        size: req.query.size ? req.query.size : 50,
        body: queryBody
      }, function(err, resp, _respcode) {
        const appointments = [];
        for (let i = 0; i < resp.hits.hits.length; i++) {
          let hit = resp.hits.hits[i];

          for (let j = 0; j < hit._source.appointments.length; j++) {
            if (hit._source.appointments[j].date === req.params.date) {
              appointments[appointments.length] = {
                id: hit._id,
                appid: hit._source.appointments[j].appid,
                fullname: typeof hit._source.surname !== 'undefined' ?
                  `${hit._source.name} ${hit._source.surname}` : hit._source.name,
                services: hit._source.appointments[j].services.map(el => el.description).join(' - '),
                planned: false
              };
              break;
            }
          }
        }
        callback(null, appointments);
      });
    }

    function getPlannedApps(callback) {
      const queryBody = {
        query: {
          bool: {
            must: { term: { 'customer.planned_appointments.date': req.params.date }}
          }
        }
      };

      client.search({
        index: req.config.mainIndex,
        type: 'customer',
        size: req.query.size ?  req.query.size : 50,
        body: queryBody
      }, function(err, resp, _respcode) {
        const appointments = [];
        for (let i = 0; i < resp.hits.hits.length; i++) {
          let hit = resp.hits.hits[i];
          for (let j = 0; j < hit._source.planned_appointments.length; j++) {
            if (hit._source.planned_appointments[j].date === req.params.date) {
              appointments[appointments.length] = {
                id: hit._id,
                appid: hit._source.planned_appointments[j].appid,
                fullname: typeof hit._source.surname !== 'undefined' ?
                  `${hit._source.name} ${hit._source.surname}` : hit._source.name,
                planned: true
              };
              break;
            }
          }
        }
        callback(null, appointments);
      });
    }

    function getPlannedCalendarApps(callback) {
      client.get({
        index: req.config.mainIndex,
        type: 'calendar',
        id: common.calendarDocId
      }, function(err, resp, _respcode) {
        const appointments = [];

        if (resp.found && resp._source.days.length > 0) {
          let calDays = resp._source.days;
          for (let i = 0; i < calDays.length; i++) {
            if (calDays[i].date === req.params.date) {
              for (let j = 0; j < calDays[i].planned_appointments.length; j++) {
                appointments.push({
                  id: undefined,
                  appid: calDays[i].planned_appointments[j].appid,
                  fullname: calDays[i].planned_appointments[j].fullname,
                  planned: true
                });
              }
              break;
            }
          }
        }
        callback(null, appointments);
      });
    }

    async.parallel(
          [getApps, getPlannedApps, getPlannedCalendarApps],
          function(err, results) {
            let appointments = [];
            for (let i = 0; i < results.length; i++) {
              for (let j = 0; j < results[i].length; j++) {
                appointments[appointments.length] = results[i][j];
              }
            }
            res.json({
              appointments: appointments
            });
          }
      );
  }

  /**
   * Updates the last_seen property of the given obj looping over the obj appointments.
   * @method
   *
   * @param {object} obj the customer object fetched from elasticsearch
   */
  static updateLastSeen(obj) {
    if (typeof obj.appointments === 'undefined' || obj.appointments.length === 0) {
      obj.last_seen = null;
    }
    else if (obj.appointments.length === 1) {
      obj.last_seen = obj.appointments[0].date;
    }
    else {
      const reduceFn = function(previousValue, currentValue, index, _array) {
        if (typeof previousValue === 'undefined' || currentValue.date > previousValue.date)
          return currentValue;
        return previousValue;
      };

      obj.last_seen = obj.appointments.reduce(reduceFn).date;
    }
  }

  /**
   * The handler that plans an appointment for the given date.
   * @method
   *
   * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
   * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
   * @param {function} _next the next middleware function to invoke, if any.
   */
  static plan(req, res, _next) {
    function planOnCustomer(isodate, id) {
      client.get({
        index: req.config.mainIndex,
        type: 'customer',
        id: id
      }, function(err, resp, _respcode) {
        if (!resp.found) {
          res.sendStatus(400);
          return;
        }
        const version = resp._version;
        const obj = resp._source;
        const appointmentId = uuid.v4();

        let alreadyPresent = false;
        if (typeof obj.appointments !== 'undefined') {
          for (let j = 0; j < obj.appointments.length; j++) {
            if (moment(obj.appointments[j].date).isSame(moment(isodate), 'day')) {
              alreadyPresent = true;
            }
          }
        }
        if (alreadyPresent) {
          const errors = [{msg: req.i18n.__(
            'Unable to plan the appointment: there is already an appointment for the same date.')}];
          res.status(400).json({errors: errors});
          return;
        }

        let plannedIndex = -1;
        if (typeof obj.planned_appointments !== 'undefined') {
          for (let i = 0; i < obj.planned_appointments.length; i++) {
            if (moment(obj.planned_appointments[i].date).isSame(moment(isodate), 'day')) {
              plannedIndex = i;
              break;
            }
          }
        }
        if (plannedIndex !== -1) {
          const errors = [{msg: req.i18n.__(
            'Unable to plan the appointment: there is already a planned appointment for the same date.')}];
          res.status(400).json({errors: errors});
          return;
        }

        if (typeof obj.planned_appointments === 'undefined')
          obj.planned_appointments = [];

        obj.planned_appointments.push({
          appid: appointmentId,
          date: isodate
        });

        client.update({
          index: req.config.mainIndex,
          type: 'customer',
          id: id,
          version: version,
          refresh: true,
          body: {doc: obj}
        }, function(err, resp, _respcode) {
          common.saveCallback(req, res, err, resp, true, {id: appointmentId});
        });
      });
    }

    function planOnCalendar(isodate, fullname) {
      client.get({
        index: req.config.mainIndex,
        type: 'calendar',
        id: common.calendarDocId
      }, function(err, resp, _respcode) {
        let calDays = [];
        if (resp.found && resp._source.days.length > 0) {
          calDays = resp._source.days;
        }
        let dateFound = false;
        const appointmentId = uuid.v4();
        for (let i = 0; i < calDays.length; i++) {
          if (calDays[i].date === isodate) {
            dateFound = true;
            calDays[i].planned_appointments.push({
              appid: appointmentId,
              fullname: fullname
            });
          }
        }
        if (!dateFound) {
          calDays.push({
            date: isodate,
            planned_appointments: [{
              appid: appointmentId,
              fullname: fullname
            }]
          });
        }

        client.index({
          index: req.config.mainIndex,
          type: 'calendar',
          id: common.calendarDocId,
          refresh: true,
          body: {days: calDays}
        }, (err, resp, _respcode) =>
            common.saveCallback(req, res, err, resp, true, {id: appointmentId})
        );
      });
    }

    if (typeof req.body.id !== 'undefined') {
      planOnCustomer(req.params.date, req.body.id);
    }
    else {
      if (typeof req.body.fullname === 'undefined') {
        res.sendStatus(400);
        return;
      }
      planOnCalendar(req.params.date, req.body.fullname);
    }
  }

  /**
   * The handler that deletes the planned appointment with the given appid.
   * @method
   *
   * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
   * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
   * @param {function} _next the next middleware function to invoke, if any.
   */
  static deletePlanned(req, res, _next) {
    const queryBody = {
      query: {
        bool: {
          should: [
            { term: { "calendar.days.planned_appointments.appid": req.params.appid }},
            { term: { "customer.planned_appointments.appid": req.params.appid }}
          ],
          minimum_should_match: 1
        }
      }
    };

    client.search({
      index: req.config.mainIndex,
      size: 1,
      body: queryBody
    }, function(err, resp, _respcode) {
      if (resp.hits.hits.length !== 1) {
        res.sendStatus(404);
        return;
      }

      const obj = resp.hits.hits[0]._source;
      const docType = resp.hits.hits[0]._type;
      const docId = resp.hits.hits[0]._id;
      if (docType === 'customer') {
        let index = -1;
        for (let i = 0; i < obj.planned_appointments.length; i++) {
          if (obj.planned_appointments[i].appid === req.params.appid) {
            index = i;
            break;
          }
        }

        if (index === -1) {
          res.sendStatus(404);
          return;
        }

        obj.planned_appointments.splice(index, 1);
      }
      else {  // calendar
        let dateIndex = -1;
        for (let i = 0; i < obj.days.length; i++) {
          if (obj.days[i].date === req.params.date) {
            dateIndex = i;
            break;
          }
        }
        if (dateIndex === -1) {
          res.sendStatus(404);
          return;
        }
        let index = -1;
        for (let i = 0; i < obj.days[dateIndex].planned_appointments.length; i++) {
          if (obj.days[dateIndex].planned_appointments[i].appid === req.params.appid) {
            index = i;
            break;
          }
        }
        if (index === -1) {
          res.sendStatus(404);
          return;
        }
        obj.days[dateIndex].planned_appointments.splice(index, 1);
      }

      client.index({
        index: req.config.mainIndex,
        type: docType,
        id: docId,
        refresh: true,
        body: obj
      }, function(err, resp, _respcode) {
        if (err) {
          console.log(err);
          res.status(400).end();
        }
        else {
          res.status(200).end();
        }
      });
    });
  }

  /**
   * The handler that returns all the appointments for the given customer.
   * @method
   *
   * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
   * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
   * @param {function} _next the next middleware function to invoke, if any.
   */
  static fetchByCustomer(req, res, _next) {
      // sort by date (descending)
    function sortFn(a, b) {
      if (a._date < b._date)
        return 1;
      if (a._date > b._date)
        return -1;
      return 0;
    }

    const obj = req.customer;
    const appointments = [];

    if (typeof obj.appointments !== 'undefined') {
      for (let i = 0; i < obj.appointments.length; i++) {
        appointments.push({
          appid: obj.appointments[i].appid,
          _date: obj.appointments[i].date,
          date: common.toLocalFormattedDate(req, obj.appointments[i].date),
          services: obj.appointments[i].services.map(el => el.description).join(' - '),
          planned: false
        });
      }
    }

    if (typeof obj.planned_appointments !== 'undefined') {
      for (let i = 0; i < obj.planned_appointments.length; i++) {
        appointments.push({
          appid: obj.planned_appointments[i].appid,
          _date: obj.planned_appointments[i].date,
          date: common.toLocalFormattedDate(req, obj.planned_appointments[i].date),
          planned: true
        });
      }
    }

    if (appointments.length > 0) {
      appointments.sort(sortFn);
    }

    res.json({
      name: obj.name,
      surname: obj.surname,
      appointments: appointments
    });
  }

  /**
   * The handler that returns the data for the appointment identified by the given appid.
   * @method
   *
   * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
   * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
   * @param {function} _next the next middleware function to invoke, if any.
   */
  static fetch(req, res, _next) {
    const obj = req.customer;
    let appointment;

    if (typeof obj.appointments === 'undefined') {
      res.sendStatus(404);
      return;
    }

    for (let j = 0; j < obj.appointments.length; j++) {
      if (obj.appointments[j].appid === req.params.appid) {
        appointment = obj.appointments[j];
        break;
      }
    }

    if (typeof appointment === 'undefined') {
      res.sendStatus(404);
      return;
    }

    res.json({
      date: common.toLocalFormattedDate(req, appointment.date),
      services: appointment.services,
      notes: appointment.notes
    });
  }

  /**
   * The handler that creates / updates an appointment if the data validation passes, or
   + returns an error message if not.
   * @method
   *
   * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
   * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
   * @param {function} _next the next middleware function to invoke, if any.
   */
  static save(req, res, _next) {
    const obj = req.customer;

      // Check & set the date
    if (!moment(req.body.date, req.config.date_format).isValid()) {
      res.sendStatus(400);
      return;
    }
    const isodate = common.toISODate(req, req.body.date);

      // If we want to update an existing appointment (appid !== undefined)
      // check if the id really exists.
    let newItem = false;
    if (typeof req.params.appid === 'undefined') {
      newItem = true;
    }

    if (typeof obj.appointments === 'undefined') {
      obj.appointments = [];
    }

    if (typeof obj.planned_appointments === 'undefined') {
      obj.planned_appointments = [];
    }

    let plannedIndex = -1;
    let appIndex = -1;

    if (newItem) {
      for (let i = 0; i < obj.planned_appointments.length; i++) {
        if (moment(obj.planned_appointments[i].date).isSame(moment(isodate), 'day')) {
          plannedIndex = i;
          break;
        }
      }
    }
    else {
      for (let i = 0; i < obj.planned_appointments.length; i++) {
        if (obj.planned_appointments[i].appid === req.params.appid) {
          plannedIndex = i;
          break;
        }
      }
      for (let i = 0; i < obj.appointments.length; i++) {
        if (obj.appointments[i].appid === req.params.appid) {
          appIndex = i;
          break;
        }
      }

      if (appIndex === -1 && plannedIndex === -1) {
        // The passed app id is not in the customer appointments or in the
        // planned ones, let's return NOT FOUND.
        res.sendStatus(404);
        return;
      }
    }

      // Check & set the services
    if (typeof req.body.services === 'undefined') {
      res.sendStatus(400);
      return;
    }

    const services = [];
    for (let i = 0; i < req.body.services.length; i++) {
      let item = req.body.services[i];
      if (item.enabled && item.description.trim().length > 0) {
        services.push({
          description: item.description.trim(),
          worker: item.worker
        });
      }
    }

    if (services.length === 0) {
      const errors = [{msg: req.i18n.__('At least one service is mandatory')}];
      res.status(400).json({errors: errors});
      return;
    }

    // Check if there is already an appointment for the requested date
    let alreadyPresent = false;
    for (let j = 0; j < obj.appointments.length; j++) {
      if (obj.appointments[j].appid !== req.params.appid) {
        if (moment(obj.appointments[j].date).isSame(moment(isodate), 'day')) {
          alreadyPresent = true;
        }
      }
    }

    if (alreadyPresent) {
      const errors = [{msg: req.i18n.__(
              'Unable to save the appointment: there is already an appointment for the same date.')}];
      res.status(400).json({errors: errors});
      return;
    }

    const appointment = {
      appid: req.params.appid,
      date: isodate,
      services: services,
      notes: req.body.notes
    };

    if (newItem) {
      appointment.appid = uuid.v4();
      obj.appointments.push(appointment);
      if (plannedIndex !== -1) {
        obj.planned_appointments.splice(plannedIndex, 1);
      }
    }
    else {
      // In case we are creating a new appointment based on a planned one,
      // let's remove the planned appointment and add the real one.
      if (appIndex === -1) {
        obj.planned_appointments.splice(plannedIndex, 1);
        obj.appointments.push(appointment);
      }
      else {
        obj.appointments[appIndex] = appointment;
      }
    }

    AppointmentHandler.updateLastSeen(obj);

    client.update({
      index: req.config.mainIndex,
      type: 'customer',
      id: req.params.id,
      version: req.customerVersion,
      refresh: true,
      body: {doc: obj}
    }, (err, resp, _respcode) =>
        common.saveCallback(req, res, err, resp, newItem, {id: appointment.appid})
    );
  }

  /**
   * The handler that deletes the appointment identified by the given appid.
   * @method
   *
   * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
   * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
   * @param {function} _next the next middleware function to invoke, if any.
   */
  static delete(req, res, _next) {
    const obj = req.customer;

    if (typeof obj.appointments === 'undefined') {
      res.sendStatus(404);
      return;
    }

    let index = -1;
    for (let i = 0; i < obj.appointments.length; i++) {
      if (obj.appointments[i].appid === req.params.appid) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      res.sendStatus(404);
      return;
    }

    obj.appointments.splice(index, 1);
    AppointmentHandler.updateLastSeen(obj);

    client.update({
      index: req.config.mainIndex,
      type: 'customer',
      id: req.params.id,
      version: req.customerVersion,
      refresh: true,
      body: {
        doc: obj
      }
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

module.exports = AppointmentHandler;