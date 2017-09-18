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

            const dataComment = {
                author: newComment.author.key,
                modified_author: newComment.updateAuthor.key,
                comment: newComment.body,
                date: newComment.created,
                modified_date: newComment.updated,
                topic_guid: topicId.uuid
            };

            const issueFields = {};
            let fieldComments;

            if (topicUpdate.fields.hasOwnProperty('comment')) {
                fieldComments = topicUpdate.fields.comment.comments.reduce((o, c) => {
                    var u = new ifcGuid.uuid(c.id);
                    o[u.uuid] = true;
                    return o;
                }, {});
            }

            for (let fieldName in topicUpdate.fields) {

                let field;
                if (topicUpdate.fields.hasOwnProperty(fieldName)) {
                    field = topicUpdate.fields[fieldName];
                }

                switch (fieldName) {
                    case 'assignee':
                        issueFields.assigned_to = field.key;
                        break;
                        //  case 'comment':
                        //    issueFields.comments = fieldComments;
                        //  break;
                    case 'created':
                        issueFields.creation_date = field;
                        break;
                    case 'reporter': // as opposed to 'creator'
                        issueFields.creation_author = field.key;
                        break;
                    case 'issuetype':
                        issueFields.topic_type = field.name;
                        break;
                    case 'priority':
                        issueFields.priority = field.name;
                        break;
                    case 'project':
                        issueFields.project_id = (new ifcGuid.uuid(field.id)).uuid;
                        break;
                    case 'status':
                        issueFields.topic_status = field.name;
                        break;
                    case 'summary':
                        issueFields.title = field;
                        break;
                    case 'updated':
                        issueFields.modified_date = field;
                        break;
                    case 'key':
                        issueFields.referenceLinks = ['https://grfnconsulting.atlassian.net/browse/' + field];
                        break;
                    default:

                        break;
                }
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
