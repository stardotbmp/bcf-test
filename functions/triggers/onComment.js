const functions = require('firebase-functions');
const admin = require("firebase-admin");
const ifcGuid = require("../ifcGuid");

//admin.initializeApp(functions.config().firebase);

exports.created = functions.database.ref('/import/from_jira/comment_created/{pushId}')
    .onCreate((event) => {

        if (event.data.exists()) {
            const data = event.data.val();
            const newComment = data.body.comment;

            console.log(newComment);

            const uuid = new ifcGuid.uuid(newComment.id);
            const topic_id = new ifcGuid.uuid(newComment.self.match(/issue\/(\d+)\/comment/)[1]);

            let dataComment = {
                author: newComment.author.key,
                modified_author: newComment.updateAuthor.key,
                comment: newComment.body,
                date: newComment.created,
                modified_date: newComment.updated,
                topic_guid: topic_id.uuid
            };

            let comment_ref = admin.database()
                .ref('data/comments')
                .child(uuid.uuid);

            let topic_ref = admin.database()
                .ref('data/topics')
                .child(topic_id.uuid)
                .child('comments')
                .child(uuid.uuid);

            return comment_ref
                .set(dataComment)
                .then(() => {
                    topic_ref
                        .set(true)
                        .then(() => {
                            console.log('Transferred');
                            event.data.ref.remove();
                        });
                })
                .catch(() => console.log('error'));
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
