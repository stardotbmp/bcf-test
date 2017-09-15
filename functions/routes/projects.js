const functions = require('firebase-functions');
const express = require('express');
const httpError = require('../httpErrors');
const admin = require("firebase-admin");
const filterToSchema = require("json-schema-filter");
const ifcGuid = require("../ifcGuid");
const router = express.Router();

router.route('/:project_id')

    .get((req, res) => {
        const schema = require("../Schemas_draft-03/Project/project_GET.json");
        const projects_ref = admin.database().ref('data/projects');
        const project_id = req.params.project_id;

        console.log('GET: Project');

        projects_ref.child(project_id).once('value').then(snapshot => {
            if (snapshot.exists()) {
                const project = snapshot.val();
                const uuid = new ifcGuid.uuid(project_id);

                project.project_id = uuid.ifcGuid;
                let valid_project = filterToSchema(schema, project);

                res
                    .status(200)
                    .send((res.locals.mode === 'full') ? project : valid_project);
            } else {
                httpError.NOT_FOUND(req, res);
            }

        });
    })
    .put(httpError.NOT_IMPLEMENTED)
    .all(httpError.NOT_ALLOWED);

router.route('/')
    .get((req, res) => {
        const schema = require("../Schemas_draft-03/Project/project_GET.json");
        const projects_ref = admin.database().ref('data/projects');

        console.log('GET: Projects');

        projects_ref.once('value').then(snapshot => {
            if (snapshot.exists()) {
                const projectList = [];

                snapshot.forEach(projectSnapshot => {
                    const project = projectSnapshot.val();
                    const project_id = projectSnapshot.key;
                    const uuid = new ifcGuid.uuid(project_id);

                    project.project_id = uuid.ifcGuid;
                    projectList.push(project);
                });

                const validProjects = Object.keys(projectList)
                    .map(key => filterToSchema(schema, projectList[key]));

                res.status(200).send((res.locals.mode === 'full') ? projectList : validProjects);
            } else {
                httpError.NOT_FOUND(req, res);
            }
        });
    })
    .all(httpError.NOT_ALLOWED);

module.exports = router;
