const functions = require('firebase-functions');
const admin = require("firebase-admin");
const ifcGuid = require("../ifcGuid");

exports.event = functions.database.ref('/import/from_jira/issue/{event}/{id}').onCreate((event) => {

    if (event.data.exists()) {

        console.log('onIssue');

        switch (event.params.event) {
            case 'issue_updated':
                issue_updated(event);
                break;
            case 'issue_created':
                issue_updated(event);
                break;
            case 'issue_generic':
                issue_updated(event);
                break;
            case 'issue_commented':
                issue_commented(event);
                break;
            case 'issue_assigned':
                issue_updated(event);
                break;
            default:
                console.log('Event handler not implemented for ' + event.params.event);

                // unhandled data reference - delete.
                //      event.data.ref.remove();
                break;
        }
    }
    return;
});

const issue_updated = function(event) {
    const data = event.data.val();
    const topicUpdate = data.body.issue;
    const topicUpdateUser = data.body.user;
    const topicFields = topicUpdate.fields;
    const topicChanges = data.body.changelog;
    const topicId = new ifcGuid.uuid(topicUpdate.id);
    const fields = topicUpdate.fields;
    const projectUpdate = topicUpdate.fields.project;
    const projectId = new ifcGuid.uuid(projectUpdate.id);
    const issueFields = {};

    issueFields.index = topicUpdate.key;
    issueFields.assigned_to = definedAttribute(fields.assignee, 'key');
    issueFields.creation_date = fields.created;
    issueFields.creation_author = definedAttribute(fields.reporter, 'key');
    issueFields.topic_type = definedAttribute(fields.issuetype, 'name');
    issueFields.description = fields.description;
    issueFields.priority = definedAttribute(fields.priority, 'name');
    issueFields.project_id = projectId.uuid;
    issueFields.topic_status = definedAttribute(fields.status, 'name');
    issueFields.title = fields.summary;
    issueFields.modified_date = fields.updated;
    issueFields.modified_user = topicUpdateUser.key;
    issueFields.due_date = (fields.duedate) ? fields.duedate : undefined;

    if (definedAttribute(fields.key)) {
        issueFields.referenceLinks = ['https://grfnconsulting.atlassian.net/browse/' +
            fields.key
        ];
    }

    console.log(fields.labels);

    let labels = (fields.labels || [])
        .reduce((labels, label) => {
            labels[label] = true;
            return labels;
        }, {});

    for (const f in issueFields)
        if (typeof issueFields[f] === 'undefined')
            delete issueFields[f];

    const topicReference = admin.database()
        .ref('data/topics')
        .child(topicId.uuid);

    const projectReference = admin.database()
        .ref('data/projects')
        .child(projectId.uuid);

    const labelsReference = admin.database()
        .ref('data/topics/')
        .child(topicId.uuid)
        .child('labels');

    topicReference
        .update(issueFields)
        .then(() => {
            console.log('topic updated.');
            projectReference
                .update({
                    name: projectUpdate.name,
                    jira_key: projectUpdate.key
                })
                .then(() => {
                    console.log('project updated.');
                    console.log(labels);
                    labelsReference.update(labels)
                        .then(() => {
                            console.log('labels updated');
                            event.data.ref.remove();
                        }).catch((error) => {
                            console.log('labels not updated.', error);
                        });
                }).catch((error) => {
                    console.log('project not updated', error);
                });
        })
        .catch((error) => {
            console.log('topic not updated', error);
            console.log(issueFields);
        });
};

const definedAttribute = function(attribute, child) {
    if (attribute === undefined) { return; }
    if (child === undefined) { return attribute; }
    if (child && attribute[child] === undefined) { return; }
    return attribute[child];
};

const issue_commented = function(event) {
    if (event.data.exists()) {
        const data = event.data.val();
        const newComment = data.body.comment;
        const topicUpdate = data.body.issue;
        const commentId = new ifcGuid.uuid(newComment.id);
        const topicId = new ifcGuid.uuid(topicUpdate.id);
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

        const topicCommentReference = admin.database()
            .ref('data/topics')
            .child(topicId.uuid)
            .child('comments');

        commentReference
            .set(dataComment)
            .then(() => {
                topicCommentReference
                    .update(fieldComments)
                    .then(() => {
                        event.data.ref.remove();
                    }).catch((error) => {
                        console.log('topicComments not updated', error);
                    });
            }).catch((error) => {
                console.log('comment not added', error);
            });
    }
};
