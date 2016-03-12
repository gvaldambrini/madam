## General overview
[![License](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](http://choosealicense.com/licenses/mit/)

A management software for my hair salon.

This web application is not intended to be generic for every salon, but in fact is
very specific to the hair salon for which it was designed. The code is still released
under an open source license ([MIT](http://opensource.org/licenses/MIT)) to allow
reusing snippets of the code in other projects (even completely unrelated!).

## Main system architecture

The backend code is written in [Node.js](https://nodejs.org) 4.x, and it is based
on the version 4 of the web framework [Express.js](http://expressjs.com/).
[Elasticsearch](https://www.elastic.co/products/elasticsearch) is
used as database, while the user interface is based on [React.js](https://github.com/facebook/react)
and styled with [Bootstrap](http://getbootstrap.com/) version 3.


### Main libraries and tools used
* [Express.js](http://expressjs.com/) for the backend code
* [Passport](http://passportjs.org/) as the authentication middleware
* [Async.js](https://github.com/caolan/async) to better structure async operations
* [Elasticsearch](https://www.elastic.co/products/elasticsearch) to store documents and as the search engine
* [Gulp](http://gulpjs.com/) as the build system and task runner
* [React.js](https://github.com/facebook/react) to create the user interface
* [jQuery](https://jquery.com/) to perform AJAX calls and implement some js components
* [Moment.js](http://momentjs.com/) for building and parsing dates
* [React Router](https://github.com/reactjs/react-router) to perform the front-end routing
* [Redux](https://github.com/reactjs/redux) to mantain a global app state
* [Immutable.js](https://facebook.github.io/immutable-js/) for the data structures used for the redux state
* [Bootstrap](http://getbootstrap.com/) for the style and some nice components
* [Webpack](https://webpack.github.io/) to bundle javascripts, styles and images
* [Sass](http://sass-lang.com/) as the css pre-processor
* [Mocha](https://mochajs.org/) for the backend API tests
* [should.js](https://github.com/shouldjs/should.js) for the BDD style assertions used in the backend API tests
* [Instanbul](https://github.com/gotwarlost/istanbul) for the code coverage
* [Nightwatch.js](http://nightwatchjs.org/) to perform end-to-end tests
* [JSDoc](https://github.com/jsdoc3/jsdoc) to generate the documentation
* [ESLint](http://eslint.org/) for the linting and code style

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
4. Launch the application with the [webpack dev server](http://webpack.github.io/docs/webpack-dev-server.html) enabled:
```
gulp
```
