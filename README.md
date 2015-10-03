## General overview
[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](http://choosealicense.com/licenses/mit/)

A management software for the hair salon "MadamPettine".

This web application is not intended to be generic for every salon, but in fact is
very specific to the hair salon for which it was designed. The code is still released
under an open source license ([MIT](http://opensource.org/licenses/MIT)) to allow
reusing snippets of the code in other projects (even completely unrelated!).

## System architecture

The backend code is written in [Node.js](https://nodejs.org) 0.12.x, and it is based
on the version 4 of the web framework [Express.js](http://expressjs.com/).
[Passport](http://passportjs.org/) with local strategy is used as the authentication
middleware while [elasticsearch](https://www.elastic.co/products/elasticsearch) is
the (main and unique) database.
The template system is [handlebars](http://handlebarsjs.com/) and the frontend code
is written using plain [jQuery](https://jquery.com/) and styled with
[Bootstrap](http://getbootstrap.com/) version 3.
[Sass](http://sass-lang.com/) is the selected css pre-processor while [Gulp](http://gulpjs.com/)
is the task runner & build system.
Finally, [Nightwatch.js](http://nightwatchjs.org/) is used to perform end-to-end
tests and [JSDoc](https://github.com/jsdoc3/jsdoc) to generate the documentation.


## Setting up the application

The application is written to run in development mode on a local environment
and in production mode (`NODE_ENV == 'production'`) on [Heroku](https://www.heroku.com/).

#### Development mode
1. [Download elasticsearch version 1.5.x](https://www.elastic.co/downloads/elasticsearch)
and launch it.
2. Generate indices and mappings running:
```
node ./scripts/generate_indices.js
```
3. Generate demo data:
```
node ./scripts/generate_data.js
```
4. Launch the application with [browsersync](http://www.browsersync.io/) enabled:
```
gulp
```