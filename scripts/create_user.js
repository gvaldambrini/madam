#!/usr/bin/env node

/**
 * @overview Create an user on elasticsearch.
 *
 * The script asks the name of the user to create and (twice) the password,
 * which will be crypted using {@link https://www.npmjs.com/package/bcrypt-nodejs|bcrypt}.
 */

var common = require('../common');
var client = common.createClient();
var async = require('async');
var promptly = require('promptly');
var bcrypt = require('bcrypt-nodejs');

async.waterfall([
        // Fetch the existing users
        function(callback) {
            client.get({
                index: 'main',
                type: 'users',
                id: common.usersDocId
            }, function(err, resp, _respcode) {
                var res;
                if (err) {
                    res = {users: []};
                }
                else {
                    res = {users: resp._source.users};
                }
                callback(null, res);
            });
        },
        // Username
        function(res, callback) {
            var nameValidator = function(value) {
                if (value.length < 5) {
                    throw new Error('The username must have a minimum length of 5');
                }

                return value;
            };
            var opt = {validator: nameValidator};
            promptly.prompt('Username: ', opt, function(err, value) {
                res.username = value;
                callback(err, res);
            });
        },
        // Verify if the username already exists and ask for confirmation
        function(res, callback) {
            function filterFn(item) {
                return item.username !== res.username;
            }
            var filteredUsers = res.users.filter(filterFn);
            if (filteredUsers.length !== res.users.length) {
                promptly.confirm(
                    'You are going to overwrite an existing user. Are you sure?',
                    function(err, value) {
                        if (!value) {
                            process.exit(0);
                        }
                        else {
                            res.users = filteredUsers;
                            callback(null, res);
                        }
                    });
            }
            else {
                callback(null, res);
            }
        },
        // Password
        function(res, callback) {
            var pwdValidator = function(value) {
                if (value === res.username) {
                    throw new Error('The password must be different from the username');
                }
                if (value.length < 5) {
                    throw new Error('The password must have a minimum length of 5');
                }

                return value;
            };
            var opt = {validator: pwdValidator};
            promptly.password('Type a password: ', opt, function(err, value) {
                res.password = value;
                callback(err, res);
            });
        },
        // Password confirmation
        function(res, callback) {
            var confirmPwdValidator = function(value) {
                if (value !== res.password) {
                    throw new Error('The password does not match the one previously entered');
                }

                return value;
            };
            var opt = {validator: confirmPwdValidator};
            promptly.password('Confirm the password: ', opt, function(err, _value) {
                callback(err, res);
            });
        },
        // Save the users on db
        function(res, callback) {
            res.users.push({
                username: res.username,
                password: bcrypt.hashSync(res.password, bcrypt.genSaltSync(10))
            });

            client.index({
                index: 'main',
                type: 'users',
                id: common.usersDocId,
                body: {
                    users: res.users
                }
            }, function(err, resp, _respcode) {
                callback(err, res);
            });
        }
    ],
    function(err, results) {
        if (err) {
            console.log(err, results);
        }
        else {
            console.log("User successfully created!");
        }
        process.exit(err ? 1 : 0);
    });
