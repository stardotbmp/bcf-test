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
                    topicReference.update(issueFields)
                        .then(() => {
                            topicCommentReference.update(fieldComments)
                                .then(() => {
                                    event.data.ref.remove();
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
    .onCreate((event) => {

        if (event.data.exists()) {
            const data = event.data.val();
            const updatedComment = data.body.comment;
            const topic = updatedComment.self.match(/issue\/(\d+)\/comment/)[1];
            const topicId = new ifcGuid.uuid(topic);
            const commentId = new ifcGuid.uuid(updatedComment.id);

            const dataComment = {
                author: updatedComment.author.key,
                modified_author: updatedComment.updateAuthor.key,
                comment: updatedComment.body,
                date: updatedComment.created,
                modified_date: updatedComment.updated,
                topic_guid: topicId.uuid
            };

            const commentReference = admin.database()
                .ref('data/comments')
                .child(commentId.uuid);

            const topicReference = admin.database()
                .ref('data/topics')
                .child(topicId.uuid);

            commentReference.update(dataComment)
                .then(() => {
                    console.log('comment updated.');
                    topicReference.update({ modified_date: updatedComment.updated })
                        .then(() => {
                            event.data.ref.remove();
                        })
                        .catch((error) => {
                            console.log('issue modified date not updated.');
                        });
                })
                .catch((error) => {
                    console.log('comment not updated.');
                });
        }
    });

exports.deleted = functions.database.ref('/import/from_jira/comment_deleted/{pushId}')
    .onCreate((event) => {
        if (event.data.exists()) {
            const data = event.data.val();
            const deletedComment = data.body.comment;
            const commentId = new ifcGuid.uuid(deletedComment.id);
            const topic = deletedComment.self.match(/issue\/(\d+)\/comment/)[1];
            const topicId = new ifcGuid.uuid(topic);

            const commentReference = admin.database()
                .ref('data/comments')
                .child(commentId.uuid);

            const topicCommentReference = admin.database()
                .ref('data/topics')
                .child(topicId.uuid)
                .child('comments')
                .child(commentId.uuid);

            commentReference.remove();
            topicCommentReference.remove();
            event.data.ref.remove();
        }

        return;
    });
