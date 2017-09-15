const admin = require("firebase-admin");
const httpError = require('./httpErrors');

exports.projectId = (req, res, next) => {
        res.locals.project_id = req.params.project_id;

        const project_id_ref = admin.database().ref('/data/projects').child(res.locals.project_id);

        project_id_ref.once('value', (snapshot) => {
                if (snapshot.exists()) {
                        console.log("Project ID: " + res.locals.project_id);
                        res.locals.selectedProject = snapshot;
                        next();
                } else {
                        res.locals.errorMessage = 'Invalid Project ID';
                        httpError.NOT_FOUND(req, res);
                }
        });
};

// Middleware to determine response mode (verbose/schema valid)
exports.queryMode = (req, res, next) => {

        res.locals.mode = (req.query.mode && req.query.mode == 'full') ? 'full' : 'valid';

        console.log("Responses will be returned as: " + res.locals.mode);
        next();
};

// Middleware to validate the schema version is accepted.
exports.validateVersion = (req, res, next) => {

        //    let terms = res.locals.url.split('/');

        //  let restApi = terms.indexOf('api');

        //res.locals.bcfVersion = terms.slice(restApi)[1];

        //res.locals.url = terms.slice(restApi+1);

        //res.locals.bcfVersion = res.locals.url.split('/')[1];

        /*
            if (res.locals.bcfVersion != "2.1" &&
                res.locals.bcfVersion != "latest" &&
                res.locals.bcfVersion != "versions") {
                res.status(404).send({
                    "message": "Schema Version not supported.",
                    "errors": [{
                        "Url": res.locals.url,
                        "Requested Schema": res.locals.bcfVersion,
                        "Version": "0.0.2"
                    }]
                });

                console.log('res.locals.url');
            } else {
                res.locals.bcfVersion = "2.1";
                next();
            }
            */

        next();
};

exports.setHeaders = (req, res, next) => {
        res
                .set('Content-Type', 'application/json')
                .set('Cache-Control', 'no-cache, no-store');

        next();
};

// This maps the custom url visit to that which would be followed at the root url
exports.stripBcfPath = (req, res, next) => {
        //req.url = req.url.replace(/^\/bcf/, '');
        //res.locals.url = req.url.replace(/^\/bcf/, '');
        next();
};
