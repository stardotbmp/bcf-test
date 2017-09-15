const functions = require('firebase-functions');
const express = require('express');
const httpError = require('../httpErrors');
const admin = require("firebase-admin");
const filterToSchema = require("json-schema-filter");
const ifcGuid = require("../ifcGuid");
const router = express.Router();

router.route('/')
.get((req, res) => {
    console.log('GET: Authentication');

    res
        .status(200)
        .send({ "message": "soon to be implemented." });
});

module.exports = router;
