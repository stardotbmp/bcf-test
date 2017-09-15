const functions = require('firebase-functions');
const express = require('express');
const httpError = require('../httpErrors');

var router = express.Router();

var projects = require('./projects');
var users = require('./users');
var authentications = require('./authentications');
var testing_170914 = require('./testing_170914');

router.use(function(req, res, next) {
    console.log("API Routes called");
    next();
});

router.use('/projects', projects);
router.use('/current-user', users);
router.use('/auth', authentications);

router.route('/users', (req, res) => {
  httpError.NOT_FOUND(req, res);
});

router.route('/')
    .all(function(req, res) {

        console.log('{"message": "not implemented"}');

        res.status(501);
        res.send('{"message": "not implemented"}');
    });

module.exports = router;
