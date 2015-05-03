var elasticsearch = require('elasticsearch');

// Create the elasticsearch client.
function createClient() {
    if (process.env.NODE_ENV == 'production')
        return new elasticsearch.Client({host: process.env.BONSAI_URL});
    return new elasticsearch.Client();
}

// Middleware to check if there is an authenticated user visiting the url.
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/login');
}

// Middleware to expose shared templates to the client side.
function exposeTemplates(req, res, next) {

    req.app.hbs.getTemplates('views/shared/', {
        cache: req.app.enabled('view cache'),
        precompiled: true
    }).then(function (templates) {
        var extRegex = new RegExp(req.app.hbs.extname + '$');

        // Creates an array of templates which are exposed via
        // `res.locals.templates`.
        templates = Object.keys(templates).map(function (name) {
            return {
                name: name.replace(extRegex, ''),
                template: templates[name]
            };
        });

        // Exposes the templates during view rendering.
        if (templates.length) {
            res.locals.templates = templates;
        }

        setImmediate(next);
    })
    .catch(next);
}

// For simplicity, we hardcode the id for 'static' documents
module.exports.workersDocId = '0b78ce22-a667-423b-bdb4-9a09b64dcf7c';
module.exports.servicesDocId = '5678a632-9d9a-43c9-b440-4f6e1f6dfea7';
module.exports.usersDocId = 'b5198cbb-3a7b-4393-a129-2593f18510d5';
module.exports.createClient = createClient;
module.exports.isAuthenticated = isAuthenticated;
module.exports.exposeTemplates = exposeTemplates;
