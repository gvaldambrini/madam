var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    isHomeActive: true,
    title: req.i18n.__('Home')});
});


module.exports = router;
