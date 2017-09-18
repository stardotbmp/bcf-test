const functions = require('firebase-functions');
const admin = require("firebase-admin");
const ifcGuid = require("../ifcGuid");

//admin.initializeApp(functions.config().firebase);

exports.created = functions.database.ref('/import/from_jira/issue_commented/{pushId}')
    .onCreate((event) => {
        if (event.data.exists()) {
            const data = event.data.val();
            const newComment = data.body.comment;
            const topicUpdate = data.body.issue;
            const commentId = new ifcGuid.uuid(newComment.id);
            const topicId = new ifcGuid.uuid(topicUpdate.id);
            const issueFields = {};
            const fields = topicUpdate.fields;
            let fieldComments;

            const dataComment = {
                author: newComment.author.key,
                modified_author: newComment.updateAuthor.key,
                comment: newComment.body,
                date: newComment.created,
                modified_date: newComment.updated,
                topic_guid: topicId.uuid
            };

            issueFields.assigned_to = fields.assignee.key;
            issueFields.creation_date = fields.created;
            issueFields.creation_author = fields.reporter.key;
            issueFields.topic_type = fields.issuetype.name;
            issueFields.priority = fields.priority.name;
            issueFields.project_id = (new ifcGuid.uuid(fields.project.id)).uuid;
            issueFields.topic_status = fields.status.name;
            issueFields.title = fields.summary;
            issueFields.modified_date = fields.updated;
            issueFields.referenceLinks = ['https://grfnconsulting.atlassian.net/browse/' + fields.key];

            for (const f in issueFields)
                if (typeof issueFields[f] === 'undefined')
                    delete issueFields[f];

            if (topicUpdate.fields.hasOwnProperty('comment')) {
                fieldComments = topicUpdate.fields.comment.comments.reduce((o, c) => {
                    var u = new ifcGuid.uuid(c.id);
                    o[u.uuid] = true;
                    return o;
                }, {});
            }

            const commentReference = admin.database()
                .ref('data/comments')
                .child(commentId.uuid);

            const topicReference = admin.database()
                .ref('data/topics')
                .child(topicId.uuid);

            const topicCommentReference = topicReference
                .child('comments');

            commentReference.set(dataComment)
                .then(() => {
                    console.log('comment created');
                    topicReference.update(issueFields)
                        .then(() => {
                            console.log('topic updated');
                            topicCommentReference.update(fieldComments)
                                .then(() => {
                                    console.log('topicComments updated');
                                }).catch(() => {
                                    console.log('topicComments not updated');
                                });
                        })
                        .catch(() => {
                            console.log('topic not updated');
                        });
                }).catch(() => {
                    console.log('comment not added');
                });
        }
    });

exports.updated = functions.database.ref('/import/from_jira/comment_updated/{pushId}')
    .onWrite((event) => {
        console.log(event.data.val());
    });

exports.deleted = functions.database.ref('/import/from_jira/comment_deleted/{pushId}')
    .onWrite((event) => {
        console.log(event.data.val());
    });
