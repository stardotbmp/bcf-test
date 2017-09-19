const functions = require('firebase-functions');
const express = require('express');
const app = express();
const admin = require("firebase-admin");
const filterToSchema = require("json-schema-filter");
const router = express.Router();
const middleware = require("./middleware");

// Provide custom logger which prefixes log statements with "[FIREBASE]"
admin.database.enableLogging(function(message) {
        // console.log("[FIREBASE]", message);
});

var serviceAccount = require("./credentials.json");

admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://bcf-test-58aad.firebaseio.com/"
});
//admin.initializeApp(functions.config().firebase);

// validations and url processing
app
        .use(middleware.queryMode)
        .use(middleware.stripBcfPath)
        .use(middleware.validateVersion)
        .use(middleware.setHeaders);

// external paths by endpoint category
var routes = require('./routes/routes');

app.get('/versions', (req, res) => {

        const schemas_ref = admin.database().ref('schemas/bcf/versions');
        console.log('API:Versions');
        const versionsList = [];

        const ref = schemas_ref.once('value', (snapshot) => {

            const versions = snapshot.val();

            Object.keys(versions).forEach((v) => {

                let version = versions[v];

                version.self = res.locals.selfUrl.replace("/versions","") + '/' + version.version_id;

                versionsList.push(version);
            });

                res
                        .status(200)
                        .send(versionsList);
        }, (err) => {
                console.log(err.stack);
                res.status(500).send('error');
        });
});

app.use('/:version', function(req, res, next) {

        console.log('Schema version: ' + req.params.version);

        res.locals.api_version = req.params.version;

        next();
});

app.use('/:version', routes);

app.get('/', (req, res) => {
        res.status(200)
                .send({
                        "server": {
                                "title": "BCF Real-time BCF Server"
                        },
                        "links": [
                                { "href": res.locals.selfUrl },
                                { "versions": res.locals.selfUrl + "/versions" }
                        ]
                });
});

/*

app.get('/versions', (req, res) => {
        res
                .status(200)
                .send({
                        "versions": [{
                                "version_id": "2.1",
                                "detailed_version": "https://github.com/BuildingSMART/BCF-API"
                        }]
                });
});

app.get('/:version/auth', (req, res) => {
        res
                .status(200)
                .send({
                        "oauth2_auth_url": "https://example.com/bcf/oauth2/auth",
                        "oauth2_token_url": "https://example.com/bcf/oauth2/token",
                        "oauth2_dynamic_client_reg_url": "https://example.com/bcf/oauth2/reg",
                        "http_basic_supported": true,
                        "supported_oauth2_flows": [
                                "authorization_code_grant",
                                "implicit_grant",
                                "resource_owner_password_credentials_grant"
                        ]
                });
});

app.get('/:version/current-user', (req, res) => {
        console.info('current-user');
        res
                .status(200)
                .send({
                        "id": "Architect@example.com",
                        "name": "John Doe"
                });
});

app.get('/:version/projects', (req, res) => {

        // OData filtering not yet implemented.
        projects_Get(req.query.mode).then((projects) => {
                res
                        .status(200)
                        .send(projects);
        }).catch(error => {
                res
                        .status(500)
                        .send(`Query Error: ${error}`);
        });
});

const projects_Get = (mode = 'valid') => {

        const schema = require("./Schemas_draft-03/Project/project_GET.json");
        const projects_ref = admin.database().ref('data/projects');

        return projects_ref.once('value').then((snapshot) => {
                const projects = snapshot.val();

                const valid_projects = Object.keys(projects).map(key => filterToSchema(schema, projects[key]));

                return (mode === 'full') ? projects : valid_projects;
        });
};

app.get('/:version/projects/:project_id', (req, res) => {
        res
                .status(200)
                .send({
                        "project_id": req.params.project_id,
                        "name": "Example project 3",
                        "authorization": {
                                "project_actions": [
                                        "update",
                                        "updateProjectExtensions"
                                ]
                        }
                });
});

app.put('/:version/projects/:project_id', (req, res) => {
        res
                .status(200)
                .send({
                        "project_id": req.params.project_id,
                        "name": "Example project 3",
                        "authorization": {
                                "project_actions": [
                                        "update",
                                        "updateProjectExtensions"
                                ]
                        }
                });
});

app.get('/:version/projects/:project_id/topics', (req, res) => {
        res
                .status(200)
                .send([{
                        "guid": "A245F4F2-2C01-B43B-B612-5E456BEF8116",
                        "creation_author": "Architect@example.com",
                        "title": "Example topic 1",
                        "labels": [
                                "Architecture",
                                "Structural"
                        ],
                        "creation_date": "2013-10-21T17:34:22.409Z"
                }, {
                        "guid": "A211FCC2-3A3B-EAA4-C321-DE22ABC8414",
                        "creation_author": "Architect@example.com",
                        "title": "Example topic 2",
                        "labels": [
                                "Architecture",
                                "Heating",
                                "Electrical"
                        ],
                        "creation_date": "2014-11-19T14:24:11.316Z"
                }]);
});

app.get('/:version/projects/:project_id/topics/:guid', (req, res) => {
        res
                .status(200)
                .send({
                        "guid": req.params.guid,
                        "creation_author": "Architect@example.com",
                        "creation_date": "2016-08-01T17:34:22.409Z",
                        "topic_type": "Clash",
                        "topic_status": "open",
                        "title": "Example topic 3",
                        "priority": "high",
                        "labels": [
                                "Architecture",
                                "Heating"
                        ],
                        "assigned_to": "harry.muster@example.com",
                        "bim_snippet": {
                                "snippet_type": "clash",
                                "is_external": true,
                                "reference": "https://example.com/bcf/1.0/ADFE23AA11BCFF444122BB",
                                "reference_schema": "https://example.com/bcf/1.0/clash.xsd"
                        },
                        "authorization": {
                                "topic_actions": [
                                        "createComment",
                                        "createViewpoint"
                                ]
                        }
                });
});

app.get('/:version/projects/:project_id/topics/:guid/snippet', (req, res) => {
        res
                .status(200)
                .send({
                        "snippet_type": "clash",
                        "is_external": true,
                        "reference": "https://example.com/bcf/1.0/ADFE23AA11BCFF444122BB",
                        "reference_schema": "https://example.com/bcf/1.0/clash.xsd"
                });
});


app.put('/:version/projects/:project_id/topics/:guid/snippet', (req, res) => {
        res
                .status(200)
                .send({
                        "snippet_type": "clash",
                        "is_external": true,
                        "reference": "https://example.com/bcf/1.0/ADFE23AA11BCFF444122BB",
                        "reference_schema": "https://example.com/bcf/1.0/clash.xsd"
                });
});

app.get('/:version/projects/:project_id/topics/:guid/files', (req, res) => {
        res
                .status(200)
                .send([{
                        "ifc_project": "0J$yPqHBD12v72y4qF6XcD",
                        "file_name": "OfficeBuilding_Architecture_0001.ifc",
                        "reference": "https://example.com/files/0J$yPqHBD12v72y4qF6XcD_0001.ifc"
                }, {
                        "ifc_project": "3hwBHP91jBRwPsmyf$3Hea",
                        "file_name": "OfficeBuilding_Heating_0003.ifc",
                        "reference": "https://example.com/files/3hwBHP91jBRwPsmyf$3Hea_0003.ifc"
                }]);
});


app.get('/:version/projects/:project_id/topics/:guid/comments', (req, res) => {
        res
                .status(200)
                .send([{
                        "guid": "C4215F4D-AC45-A43A-D615-AA456BEF832B",
                        "date": "2016-08-01T12:34:22.409Z",
                        "author": "max.muster@example.com",
                        "comment": "Clash found",
                        "topic_guid": "B345F4F2-3A04-B43B-A713-5E456BEF8228",
                        "authorization": {
                                "comment_actions": [
                                        "update"
                                ]
                        }
                }, {
                        "guid": "A333FCA8-1A31-CAAC-A321-BB33ABC8414",
                        "date": "2016-08-01T14:24:11.316Z",
                        "author": "bob.heater@example.com",
                        "comment": "will rework the heating model",
                        "topic_guid": "B345F4F2-3A04-B43B-A713-5E456BEF8228"
                }]);
});

app.get('/:version/projects/:project_id/topics/:topic_guid/comments/:guid', (req, res) => {
        res
                .status(200)
                .send({
                        "guid": req.params.guid,
                        "date": "2016-08-01T14:24:11.316Z",
                        "author": "bob.heater@example.com",
                        "comment": "will rework the heating model",
                        "topic_guid": req.params.topic_guid
                });
});

app.put('/:version/projects/:project_id/topics/:topic_guid/comments/:guid', (req, res) => {
        res
                .status(200)
                .send({
                        "guid": req.params.guid,
                        "date": "2016-08-01T14:24:11.316Z",
                        "author": "bob.heater@example.com",
                        "modified_date": "2016-08-01T19:24:11.316Z",
                        "modified_author": "bob.heater@example.com",
                        "comment": "will rework the heating model and fix the ventilation",
                        "topic_guid": req.params.topic_guid
                });
});

app.post('/:version/projects/:project_id/topics/:guid/comments', (req, res) => {
        res
                .status(201)
                .send({
                        "guid": "A333FCA8-1A31-CAAC-A321-BB33ABC8414",
                        "date": "2016-08-01T14:24:11.316Z",
                        "author": "bob.heater@example.com",
                        "comment": "will rework the heating model",
                        "topic_guid": req.params.guid
                });
});

app.put('/:version/projects/:project_id/topics/:guid/files', (req, res) => {
        res
                .status(200)
                .send([{
                        "ifc_project": "0J$yPqHBD12v72y4qF6XcD",
                        "file_name": "OfficeBuilding_Architecture_0001.ifc",
                        "reference": "https://example.com/files/0J$yPqHBD12v72y4qF6XcD_0001.ifc"
                }, {
                        "ifc_project": "3hwBHP91jBRwPsmyf$3Hea",
                        "file_name": "OfficeBuilding_Heating_0003.ifc",
                        "reference": "https://example.com/files/3hwBHP91jBRwPsmyf$3Hea_0003.ifc"
                }]);
});

app.put('/:version/projects/:project_id/topics/:guid', (req, res) => {
        res
                .status(200)
                .send({
                        "guid": req.params.guid,
                        "creation_author": "Architect@example.com",
                        "creation_date": "2016-08-01T17:34:22.409Z",
                        "modified_author": "Architect@example.com",
                        "modified_date": "2016-08-02T13:22:22.409Z",
                        "topic_type": "Clash",
                        "topic_status": "open",
                        "title": "Example topic 3 - Changed Title",
                        "priority": "high",
                        "labels": [
                                "Architecture",
                                "Heating"
                        ],
                        "assigned_to": "harry.muster@example.com",
                        "bim_snippet": {
                                "snippet_type": "clash",
                                "is_external": true,
                                "reference": "https://example.com/bcf/1.0/ADFE23AA11BCFF444122BB",
                                "reference_schema": "https://example.com/bcf/1.0/clash.xsd"
                        }
                });
});

app.get('/:version/projects/:project_id/topics/:guid/viewpoints', (req, res) => {
        res
                .status(200)
                .send([{
                        "guid": "b24a82e9-f67b-43b8-bda0-4946abf39624",
                        "perspective_camera": {
                                "camera_view_point": {
                                        "x": 0.0,
                                        "y": 0.0,
                                        "z": 0.0
                                },
                                "camera_direction": {
                                        "x": 1.0,
                                        "y": 1.0,
                                        "z": 2.0
                                },
                                "camera_up_vector": {
                                        "x": 0.0,
                                        "y": 0.0,
                                        "z": 1.0
                                },
                                "field_of_view": 90.0
                        },
                        "lines": [{
                                "start_point": {
                                        "x": 2.0,
                                        "y": 1.0,
                                        "z": 1.0
                                },
                                "end_point": {
                                        "x": 0.0,
                                        "y": 1.0,
                                        "z": 0.7
                                }
                        }],
                        "clipping_planes": [{
                                "location": {
                                        "x": 0.7,
                                        "y": 0.3,
                                        "z": -0.2
                                },
                                "direction": {
                                        "x": 1.0,
                                        "y": 0.4,
                                        "z": 0.1
                                }
                        }]
                }, {
                        "guid": "a11a82e7-e66c-34b4-ada1-5846abf39133",
                        "perspective_camera": {
                                "camera_view_point": {
                                        "x": 0.0,
                                        "y": 0.0,
                                        "z": 0.0
                                },
                                "camera_direction": {
                                        "x": 1.0,
                                        "y": 1.0,
                                        "z": 2.0
                                },
                                "camera_up_vector": {
                                        "x": 0.0,
                                        "y": 0.0,
                                        "z": 1.0
                                },
                                "field_of_view": 90.0
                        },
                        "lines": [{
                                "start_point": {
                                        "x": 1.0,
                                        "y": 1.0,
                                        "z": 1.0
                                },
                                "end_point": {
                                        "x": 0.0,
                                        "y": 0.0,
                                        "z": 0.0
                                }
                        }],
                        "clipping_planes": [{
                                "location": {
                                        "x": 0.5,
                                        "y": 0.5,
                                        "z": 0.5
                                },
                                "direction": {
                                        "x": 1.0,
                                        "y": 0.0,
                                        "z": 0.0
                                }
                        }]
                }]);
});

app.get('/:version/projects/:project_id/topics/:topic_guid/viewpoints/:guid', (req, res) => {
        res
                .status(200)
                .send({
                        "guid": req.params.guid,
                        "index": 10,
                        "perspective_camera": {
                                "camera_view_point": {
                                        "x": 0.0,
                                        "y": 0.0,
                                        "z": 0.0
                                },
                                "camera_direction": {
                                        "x": 1.0,
                                        "y": 1.0,
                                        "z": 2.0
                                },
                                "camera_up_vector": {
                                        "x": 0.0,
                                        "y": 0.0,
                                        "z": 1.0
                                },
                                "field_of_view": 90.0
                        },
                        "lines": [{
                                "start_point": {
                                        "x": 1.0,
                                        "y": 1.0,
                                        "z": 1.0
                                },
                                "end_point": {
                                        "x": 0.0,
                                        "y": 0.0,
                                        "z": 0.0
                                }
                        }],
                        "clipping_planes": [{
                                "location": {
                                        "x": 0.5,
                                        "y": 0.5,
                                        "z": 0.5
                                },
                                "direction": {
                                        "x": 1.0,
                                        "y": 0.0,
                                        "z": 0.0
                                }
                        }],
                        "bitmaps": [{
                                "guid": "20c1cb56-315f-4a0a-922d-ed7a4a8edf55",
                                "bitmap_type": "jpg",
                                "location": {
                                        "x": 10.0,
                                        "y": -10.0,
                                        "z": 7.0
                                },
                                "normal": {
                                        "x": -1.0,
                                        "y": 1.25,
                                        "z": 0.0
                                },
                                "up": {
                                        "x": -5.4,
                                        "y": -4.3,
                                        "z": 1.0
                                },
                                "height": 1666
                        }],
                        "snapshot": {
                                "snapshot_type": "png"
                        }
                });
});

app.get('/:version/projects/:project_id/topics/:topic_guid/viewpoints/:guid/snapshot', (req, res) => {
        res
                .status(200)
                .send({
                        "snapshot_type": "png"
                });
});

app.get('/:version/projects/:project_id/topics/:topic_guid/viewpoints/:viewpoint_guid/bitmaps/:guid', (req, res) => {
        res
                .status(200)
                .send({
                        "guid": req.params.guid,
                        "bitmap_type": "jpg",
                        "location": {
                                "x": 10.0,
                                "y": -10.0,
                                "z": 7.0
                        },
                        "normal": {
                                "x": -1.0,
                                "y": 1.25,
                                "z": 0.0
                        },
                        "up": {
                                "x": -5.4,
                                "y": -4.3,
                                "z": 1.0
                        },
                        "height": 1666
                });
});

app.get('/:version/projects/:project_id/topics/:topic_guid/viewpoints/:guid/selection', (req, res) => {
        res
                .status(200)
                .send([{
                        "ifc_guid": "2MF28NhmDBiRVyFakgdbCT",
                        "originating_system": "Example CAD Application",
                        "authoring_tool_id": "EXCAD/v1.0"
                }, {
                        "ifc_guid": "3$cshxZO9AJBebsni$z9Yk",
                }]);
});

app.get('/:version/projects/:project_id/topics/:topic_guid/viewpoints/:guid/visibility', (req, res) => {
        res
                .status(200)
                .send({
                        "default_visibility": true,
                        "exceptions": [{
                                "ifc_guid": "2MF28NhmDBiRVyFakgdbCT",
                                "originating_system": "Example CAD Application",
                                "authoring_tool_id": "EXCAD/v1.0"
                        }, {
                                "ifc_guid": "3$cshxZO9AJBebsni$z9Yk",
                        }],
                        "view_setup_hints": {
                                "spaces_visible": true,
                                "space_boundaries_visible": false,
                                "openings_visible": true
                        }
                });
});

app.get('/:version/projects/:project_id/topics/:topic_guid/viewpoints/:guid/coloring', (req, res) => {
        res
                .status(200)
                .send([{
                        "color": "#ff0000",
                        "components": [{
                                "ifc_guid": "2MF28NhmDBiRVyFakgdbCT",
                                "originating_system": "Example CAD Application",
                                "authoring_tool_id": "EXCAD/v1.0"
                        }, {
                                "ifc_guid": "3$cshxZO9AJBebsni$z9Yk",
                        }]
                }]);
});

app.get('/:version/projects/:project_id/topics/:guid/related_topics', (req, res) => {
        res
                .status(200)
                .send([{
                        "related_topic_guid": "db49df2b-0e42-473b-a3ee-f7b785d783c4"
                }, {
                        "related_topic_guid": "6963a846-54d1-4050-954d-607cd5e48aa3"
                }]);
});

app.put('/:version/projects/:project_id/topics/:guid/related_topics', (req, res) => {
        res
                .status(200)
                .send([{
                        "related_topic_guid": "db49df2b-0e42-473b-a3ee-f7b785d783c4"
                }, {
                        "related_topic_guid": "6963a846-54d1-4050-954d-607cd5e48aa3"
                }, {
                        "related_topic_guid": "bac66ab4-331e-4f21-a28e-083d2cf2e796"
                }]);
});

app.get('/:version/projects/:project_id/topics/:guid/document_references', (req, res) => {
        res
                .status(200)
                .send([{
                        "guid": "472ab37a-6122-448e-86fc-86503183b520",
                        "referenced_document": "http://example.com/files/LegalRequirements.pdf",
                        "description": "The legal requirements for buildings."
                }, {
                        "guid": "6cbfe31d-95c3-4f4d-92a6-420c23698721",
                        "referenced_document": "http://example.com/files/DesignParameters.pdf",
                        "description": "The building owners global design parameters for buildings."
                }]);
});

app.post('/:version/projects/:project_id/topics/:guid/document_references', (req, res) => {
        res
                .status(201)
                .send([{
                        "guid": "472ab37a-6122-448e-86fc-86503183b520",
                        "referenced_document": "http://example.com/files/LegalRequirements.pdf",
                        "description": "The legal requirements for buildings."
                }]);
});

app.put('/:version/projects/:project_id/topics/:topic_guid/document_references/:guid', (req, res) => {
        res
                .status(200)
                .send([{
                        "guid": req.params.guid,
                        "referenced_document": "http://example.com/files/LegalRequirements.pdf",
                        "description": "The legal requirements for buildings."
                }]);
});

app.get('/:version/projects/:project_id/topics/:topic_guid/document_references/:guid', (req, res) => {
        res
                .status(200)
                .send([{
                        "guid": req.params.guid,
                        "referenced_document": "http://example.com/files/LegalRequirements.pdf",
                        "description": "The legal requirements for buildings."
                }]);
});

app.post('/:version/projects/:project_id/topics/:guid/viewpoints', (req, res) => {
        res
                .status(201)
                .send({
                        "guid": "a11a82e7-e66c-34b4-ada1-5846abf39133",
                        "index": 10,
                        "perspective_camera": {
                                "camera_view_point": {
                                        "x": 0.0,
                                        "y": 0.0,
                                        "z": 0.0
                                },
                                "camera_direction": {
                                        "x": 1.0,
                                        "y": 1.0,
                                        "z": 2.0
                                },
                                "camera_up_vector": {
                                        "x": 0.0,
                                        "y": 0.0,
                                        "z": 1.0
                                },
                                "field_of_view": 90.0
                        },
                        "lines": [{
                                "start_point": {
                                        "x": 1.0,
                                        "y": 1.0,
                                        "z": 1.0
                                },
                                "end_point": {
                                        "x": 0.0,
                                        "y": 0.0,
                                        "z": 0.0
                                }
                        }],
                        "clipping_planes": [{
                                "location": {
                                        "x": 0.5,
                                        "y": 0.5,
                                        "z": 0.5
                                },
                                "direction": {
                                        "x": 1.0,
                                        "y": 0.0,
                                        "z": 0.0
                                }
                        }],
                        "bitmaps": [{
                                "guid": "20c1cb56-315f-4a0a-922d-ed7a4a8edf55",
                                "bitmap_type": "jpg",
                                "location": {
                                        "x": 10.0,
                                        "y": -10.0,
                                        "z": 7.0
                                },
                                "normal": {
                                        "x": -1.0,
                                        "y": 1.25,
                                        "z": 0.0
                                },
                                "up": {
                                        "x": -5.4,
                                        "y": -4.3,
                                        "z": 1.0
                                },
                                "height": 1666
                        }],
                        "snapshot": {
                                "snapshot_type": "png"
                        }
                });
});

app.post('/:version/projects/:project_id/topics', (req, res) => {
        res
                .status(201)
                .send({
                        "guid": "A245F4F2-2C01-B43B-B612-5E456BEF8116",
                        "creation_author": "Architect@example.com",
                        "creation_date": "2016-08-01T17:34:22.409Z",
                        "topic_type": "Clash",
                        "topic_status": "open",
                        "title": "Example topic 3",
                        "priority": "high",
                        "labels": [
                                "Architecture",
                                "Heating"
                        ],
                        "assigned_to": "harry.muster@example.com",
                        "bim_snippet": {
                                "snippet_type": "clash",
                                "is_external": true,
                                "reference": "https://example.com/bcf/1.0/ADFE23AA11BCFF444122BB",
                                "reference_schema": "https://example.com/bcf/1.0/clash.xsd"
                        }
                });
});

app.get('/:version/projects/:project_id/extensions', (req, res) => {
        res
                .status(200)
                .send({
                        "topic_type": [
                                "Information",
                                "Error"
                        ],
                        "topic_status": [
                                "Open",
                                "Closed",
                                "ReOpened"
                        ],
                        "topic_label": [
                                "Architecture",
                                "Structural",
                                "MEP"
                        ],
                        "snippet_type": [
                                ".ifc",
                                ".csv"
                        ],
                        "priority": [
                                "Low",
                                "Medium",
                                "High"
                        ],
                        "user_id_type": [
                                "Architect@example.com",
                                "BIM-Manager@example.com",
                                "bob_heater@example.com"
                        ],
                        "stage": [
                                "Preliminary Planning End",
                                "Construction Start",
                                "Construction End"
                        ],
                        "project_actions": [
                                "update",
                                "createTopic",
                                "createDocument",
                                "updateProjectExtensions"
                        ],
                        "topic_actions": [
                                "update",
                                "updateBimSnippet",
                                "updateRelatedTopics",
                                "updateDocumentServices",
                                "updateFiles",
                                "createComment",
                                "createViewpoint"
                        ],
                        "comment_actions": [
                                "update"
                        ]
                });
});

app.get('/:version/projects/:project_id/documents', (req, res) => {
        res
                .status(200)
                .send([{
                        "guid": "472ab37a-6122-448e-86fc-86503183b520",
                        "filename": "LegalRequirements.pdf"
                }, {
                        "guid": "6cbfe31d-95c3-4f4d-92a6-420c23698721",
                        "filename": "DesignParameters.pdf"
                }]);
});

app.post('/:version/projects/:project_id/documents', (req, res) => {
        res
                .status(201)
                .send({
                        "guid": "472ab37a-6122-448e-86fc-86503183b520",
                        "filename": "Official_Building_Permission.pdf"
                });
});

app.get('/:version/projects/:project_id/documents/:guid', (req, res) => {
        res
                .status(200)
                .send({
                        "guid": req.params.guid,
                        "filename": "LegalRequirements.pdf"
                });
});

app.get('/:version/projects/:project_id/topics/events', (req, res) => {
        res
                .status(200)
                .send([{
                        "topic_guid": "A211FCC2-3A3B-EAA4-C321-DE22ABC8414",
                        "date": "2014-11-19T14:24:11.316Z",
                        "author": "Architect@example.com",
                        "events": [{
                                "type": "status_updated",
                                "value": "Closed"
                        }]
                }, {
                        "topic_guid": "A245F4F2-2C01-B43B-B612-5E456BEF8116",
                        "date": "2013-10-21T17:34:22.409Z",
                        "author": "Architect@example.com",
                        "events": [{
                                "type": "type_updated",
                                "value": "Warning"
                        }]
                }]);
});

app.get('/:version/projects/:project_id/topics/:guid/events', (req, res) => {
        res
                .status(200)
                .send([{
                        "topic_guid": req.params.guid,
                        "date": "2014-11-19T14:24:11.316Z",
                        "author": "Architect@example.com",
                        "events": [{
                                "type": "type_updated",
                                "value": "Error"
                        }]
                }, {
                        "topic_guid": req.params.guid,
                        "date": "2013-10-21T17:34:22.409Z",
                        "author": "Architect@example.com",
                        "events": [{
                                "type": "status_updated",
                                "value": "Open"
                        }]
                }]);
});

app.get('/:version/projects/:project_id/topics/comments/events', (req, res) => {
        res
                .status(200)
                .send([{
                        "comment_guid": "C4215F4D-AC45-A43A-D615-AA456BEF832B",
                        "topic_guid": "A211FCC2-3A3B-EAA4-C321-DE22ABC8414",
                        "date": "2014-11-19T14:24:11.316Z",
                        "author": "Architect@example.com",
                        "events": [{
                                "type": "comment_created",
                                "value": null
                        }]
                }, {
                        "comment_guid": "C4215F4D-AC45-A43A-D615-AA456BEF832B",
                        "topic_guid": "A245F4F2-2C01-B43B-B612-5E456BEF8116",
                        "date": "2013-10-21T17:34:22.409Z",
                        "author": "Architect@example.com",
                        "events": [{
                                "type": "viewpoint_updated",
                                "value": "b24a82e9-f67b-43b8-bda0-4946abf39624"
                        }]
                }]);
});

app.get('/:version/projects/:project_id/topics/:topic_guid/comments/:comment_guid/events', (req, res) => {
        res
                .status(200)
                .send([{
                        "comment_guid": req.params.comment_guid,
                        "topic_guid": req.params.topic,
                        "date": "2014-11-19T14:24:11.316Z",
                        "author": "Architect@example.com",
                        "events": [{
                                "type": "comment_created",
                                "value": null
                        }]
                }, {
                        "comment_guid": req.params.comment_guid,
                        "topic_guid": req.params.topic,
                        "date": "2013-10-21T17:34:22.409Z",
                        "author": "Architect@example.com",
                        "events": [{
                                "type": "comment_text_updated",
                                "value": "This is the updated comment"
                        }]
                }]);
});

*/

/**
 * The BCF endpoint runs the `app` which contains the
 */
exports.bcf = functions.https.onRequest(app);

const jiraWebhook = require('./triggers/onJira');
exports.jira = jiraWebhook.jira;

const onJiraComment = require('./triggers/onComment');
//exports.onJiraCommentCreated = jiraOnComment.created;
//exports.onJiraCommentUpdated = jiraOnComment.updated;
//exports.onJiraCommentDeleted = jiraOnComment.deleted;
exports.onJiraComment = onJiraComment.event;


const onJiraIssue = require('./triggers/onIssue');
exports.onJiraIssue = onJiraIssue.event;