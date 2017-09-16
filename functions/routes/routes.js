const functions = require('firebase-functions');
const express = require('express');
const httpError = require('../httpErrors');

var router = express.Router();

var projects = require('./projects');
var users = require('./users');
var authentications = require('./authentications');

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
    .get((req, res) => {

        var response = {
            "data": ("BCF API Server - Schema " + res.locals.api_version),
            "links": {"projects": res.locals.selfUrl + '/projects'}
        };

        res
            .status(200)
            .send(response);
    })
    .all((req, res) => {
        res
            .status(501)
            .send('{"message": "not implemented"}');
    });

module.exports = router;
