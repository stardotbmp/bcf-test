const functions = require('firebase-functions');
const express = require('express');
const httpError = require('../httpErrors');
const admin = require("firebase-admin");
const filterToSchema = require("json-schema-filter");
const ifcGuid = require("../ifcGuid");
const router = express.Router();

router.route('/')
    .get((req, res) => {
        const schema = require("../Schemas_draft-03/Collaboration/Topic/topic_GET.json");
        const topics_ref = admin.database().ref('data/topics');
        const project_topics_ref = admin.database().ref('data/project_topics');

        const filter_params = [
            'creation_author',
            'modified_author',
            'assigned_to',
            'stage',
            'topic_status',
            'topic_type',
            'creadtion_date',
            'modified_date',
            'labels'
        ];

        const sort_params = [
            'creation_date',
            'modified_date',
            'index'
        ];

        console.log('GET: Topics');

        const topicsList = [];

        topics_ref
            .orderByChild('project_id')
            .startAt(res.locals.project_id)
            .endAt(res.locals.project_id)
            .once('value', (snapshot) => {
                if (snapshot.exists()) {

                    snapshot.forEach((topicSnapshot) => {
                        topicsList.push(topicSnapshot.val());
                    });

                    const valid_topics = topicsList
                        .map(topic => filterToSchema(schema, topic));

                    res.send(topicsList);

                } else {

                    res.status(200).send([]);
                }
            });

    })
    .put(httpError.NOT_IMPLEMENTED)
    .all(httpError.NOT_ALLOWED);

module.exports = router;
