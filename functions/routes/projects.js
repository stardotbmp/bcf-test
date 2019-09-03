const functions = require('firebase-functions');
const express = require('express');
const httpError = require('../httpErrors');
const admin = require("firebase-admin");
const filterToSchema = require("json-schema-filter");
const ifcGuid = require("../ifcGuid");
const router = express.Router();
const middleware = require("../middleware");

var topics = require('./topics');

router.use('/:project_id', middleware.projectId);
router.use('/:project_id/topics', topics);

const projectSchema = require("../Schemas_draft-03/Project/project_GET.json");

router.route('/:project_id')
    .get((req, res) => {
        const projects_ref = admin.database().ref('data/projects');
        const project_id = req.params.project_id;

        console.log('GET: Project');
        //console.log(res.locals.selectedProject);

        const project = res.locals.selectedProject.val();
        const uuid = new ifcGuid.uuid(project_id);

        project.project_id = uuid.ifcGuid;

        project.links = {
            "self": res.locals.selfUrl,
            "topics": res.locals.selfUrl + '/topics'
        };

        let valid_project = filterToSchema(projectSchema, project);

        res
            .status(200)
            .send((res.locals.mode === 'full') ? project : valid_project);

    })
    .put(httpError.NOT_IMPLEMENTED)
    .all(httpError.NOT_ALLOWED);

router.route('/')
    .get((req, res) => {
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
                    project.links = {
                        "self": res.locals.selfUrl + "/" + project_id,
                        "topics": res.locals.selfUrl + "/" + project_id + '/topics'
                    };
                    projectList.push(project);
                });

                const validProjects = projectList
                    .map(project => filterToSchema(projectSchema, project));

                res.status(200).send((res.locals.mode === 'full') ? projectList : validProjects);
            } else {
                httpError.NOT_FOUND(req, res);
            }
        });
    })
    .all(httpError.NOT_ALLOWED);

module.exports = router;
