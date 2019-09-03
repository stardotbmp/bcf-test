const functions = require('firebase-functions');
const express = require('express');
const httpError = require('../httpErrors');
const admin = require("firebase-admin");
const filterToSchema = require("json-schema-filter");
const ifcGuid = require("../ifcGuid");
const router = express.Router();
const middleware = require("../middleware");

const commentSchema = require("../Schemas_draft-03/Collaboration/Comment/comment_GET.json");

router.route('/')
    .get((req, res) => {
        console.log('GET: Comments');
        const filter_params = [];
        const sort_params = [];

        const comments_ref = admin.database().ref('data/comments');

        const commentList = [];

        comments_ref
            .orderByChild('topic_guid')
            .startAt(res.locals.topic_id)
            .endAt(res.locals.topic_id)
            .once('value', (snapshot) => {
                if (snapshot.exists()) {

                    snapshot.forEach((commentSnapshot) => {
                        let comment = commentSnapshot.val();
                        comment.links = {
                            "self": res.locals.selfUrl + '/' + commentSnapshot.key,
                            "topic": res.locals.selfUrl.replace(/\/comments$/, ""),
                            "project": res.locals.selfUrl.replace(/\/topics\/[\-A-Z0-9]*\/comments$/i,"")
                        };
                        comment.guid = commentSnapshot.key;

                        commentList.push(comment);

                    });

                    const validComments = commentList
                        .map((comment) => filterToSchema(commentSchema, comment));

                    res.send((res.locals.mode === 'full') ? commentList : validComments);

                } else {
                    res.status(200).send([]);
                }
            });
    })
    .post(httpError.NOT_IMPLEMENTED)
    .all(httpError.NOT_ALLOWED);

module.exports = router;
