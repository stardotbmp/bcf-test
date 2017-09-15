const functions = require('firebase-functions');
const express = require('express');
const httpError = require('../httpErrors');
const admin = require("firebase-admin");
const filterToSchema = require("json-schema-filter");
const router = express.Router();

router.route('/')
    .get((req, res) => {
        console.log('GET: Current User');
        const schema = require("../Schemas_draft-03/User/user_GET.json");

        console.log(schema);
        const users_ref = admin.database().ref('data/users');

        // mock by getting the first user for the time being.
        // This needs to be tied into authorisation
        //
        // auth would be to add :user_id as a child o the ref
        // prior to query. In theory only one would then be
        // returned.
        // users_ref.limitToFirst(1).once('value', (snapshot) => {
        users_ref
            .orderByChild('id')
            .startAt('jonathon@stardotbmp.com')
            .endAt('jonathon@stardotbmp.com')
            .once('value', (snapshot) => {

            console.log('users');
                res
                    .status(200)
                    .send(snapshot.val());
            }, (error) => {
                console.log('something went wrong');
                res.status(500).send('oops');
            });

    });

module.exports = router;