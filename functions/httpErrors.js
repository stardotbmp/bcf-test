exports.NOT_ALLOWED = (req, res) => {
    res.status(405).send({ "message": "Not Allowed." });
};

exports.NOT_IMPLEMENTED = (req, res) => {
    res.status(501).send({ "message": "Not Implemented." });
};

exports.NOT_FOUND = (req, res) => {
    res.status(404).send({ "message": "Not Found." });
};