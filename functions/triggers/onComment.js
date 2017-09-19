const functions = require('firebase-functions');
const admin = require("firebase-admin");
const ifcGuid = require("../ifcGuid");

exports.event = functions.database.ref('/import/from_jira/comment/{event}/{id}').onCreate((event) => {

    if (event.data.exists()) {

        console.log('onComment');

        switch (event.params.event) {
            case 'comment_updated':
                comment_updated(event);
                break;
            case 'comment_deleted':
                comment_deleted(event);
                break;
            default:
                console.log('Event handler not implemented for ' + event.params.event);

                // unhandled data reference - delete.
                event.data.ref.remove();
                break;
        }
    }
    return;
});

const comment_updated = function(event) {
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
};

const comment_deleted = function(event) {
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
};
