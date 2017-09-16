const functions = require('firebase-functions');
const express = require('express');
const httpError = require('../httpErrors');
const admin = require("firebase-admin");
const filterToSchema = require("json-schema-filter");
const ifcGuid = require("../ifcGuid");
const router = express.Router();
const middleware = require("../middleware");

const topicSchema = require("../Schemas_draft-03/Collaboration/Topic/topic_GET.json");

var comments = require('./comments');
router.use('/:topic_id', middleware.topicId);
router.use('/:topic_id/comments', comments);

router.route('/:topic_id')
    .get((req, res) => {
        const topics_ref = admin.database().ref('data/topics');

        const topic_id = req.params.topic_id;

        topics_ref.child(topic_id).once('value', (snapshot) => {

            const topic = snapshot.val();

            topic.links = {
                "self": res.locals.selfUrl,
                "project": res.locals.selfUrl.replace(/\/topics\/[\-A-Z0-9]*$/i,""),
                "comments": res.locals.selfUrl + '/comments'
            };

            topic.guid = topic_id;

            const validTopic = filterToSchema(topicSchema, topic);
            res.send((res.locals.mode === 'full') ? topic : validTopic);
        });

    })
    .put((req, res) => {})
    .post((req, res) => {})
    .patch(httpError.NOT_IMPLEMENTED)
    .all(httpError.NOT_ALLOWED);

router.route('/')
    .get((req, res) => {
        const topics_ref = admin.database().ref('data/topics');

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

                        let topic = topicSnapshot.val();

                        topic.links = {
                            "self": res.locals.selfUrl + '/' + topicSnapshot.key,
                            "project": res.locals.selfUrl.replace(/\/topics$/i,""),
                           /* "comments": res.locals.selfUrl + '/' + topicSnapshot.key + '/comments'*/
                        };

                        topic.self = res.locals.selfUrl + '/' + topicSnapshot.key;
                        topic.guid = topicSnapshot.key;

                        console.log("topic self: " + topic.self);

                        topicsList.push(topic);
                    });

                    const validTopics = topicsList
                        .map(topic => filterToSchema(topicSchema, topic));

                    res.send((res.locals.mode === 'full') ? topicsList : validTopics);
                } else {
                    res.status(200).send([]);
                }
            });

    })
    .post(httpError.NOT_IMPLEMENTED)
    .all(httpError.NOT_ALLOWED);

module.exports = router;


