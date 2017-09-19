const functions = require('firebase-functions');
const admin = require("firebase-admin");

/**
 * JIRA endpoint is the webhook used by the JIRA platform.
 *
 * This is, for now, a single endpoint used for all JIRA activity.
 * Future revisions may deal with specific events to separate the
 * platform events from the issue events.
 */
exports.jira = functions.https.onRequest((req, res) => {

        const webhooks_ref = admin.database().ref('import/from_jira');

        if (!req.body) {
                res.status(422).send("No request.body");
                return;
        }

        const eventFamily = req.body.webhookEvent.split('_')[0].replace('jira:','');
        const event = req.body.webhookEvent;

        const eventRoute = webhooks_ref.child(eventFamily);

        let route = eventRoute.child(event);

        if (req.body.issue_event_type_name) {
                route = eventRoute.child(req.body.issue_event_type_name);
        }

        let payload = {
                timestamp: req.body.timestamp,
                body: req.body,
                params: req.params,
                query: req.query
        };

        route.push(payload);

        res.status(201).send();
});