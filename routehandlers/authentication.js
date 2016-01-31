"use strict";

const passport = require('passport');

/**
 * Helper class that brings together all the route handlers (declared as static methods)
 * that are related to the user authentication.
 * @class AuthenticationHandler
 */
class AuthenticationHandler {
    /**
     * The handler that performs the user login using passport with a local strategy defined in
     * the main app module.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} next the next middleware function to invoke, if any.
     */
    static login(req, res, next) {
        passport.authenticate('login', function(err, user, info) {
            if (!user) {
                if (typeof info !== 'undefined' && info.message === 'Missing credentials') {
                    // The verify callback (the function passed as second argument to the LocalStrategy
                    // class) is not called if the username or the password is missing. Instead,
                    // the returned error is null, the username false but the info is equal to the
                    // standard string 'Missing credentials', which is the one used here to provide
                    // a meaningful message to the frontend.
                    const msg = req.i18n.__(req.body.username  ? 'Missing password.' : 'Missing username.');
                    res.status(400).json({errors: [{msg: msg}]});
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
    }

    /**
     * The handler that performs the user logout.
     * @method
     *
     * @param {object} req the current {@link http://expressjs.com/4x/api.html#req|request object}.
     * @param {object} res the {@link http://expressjs.com/4x/api.html#res|response object}.
     * @param {function} _next the next middleware function to invoke, if any.
     */
    static logout(req, res, _next) {
      req.logout();
      res.status(200).end();
    }
}

module.exports = AuthenticationHandler;