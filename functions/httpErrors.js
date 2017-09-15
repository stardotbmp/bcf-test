exports.NOT_ALLOWED = (req, res) => {
    const message = res.locals.errorMessage || "Not Allowed.";
    res.status(405).send({ "message": message });
};

exports.NOT_IMPLEMENTED = (req, res) => {
    const message = res.locals.errorMessage || "Not Implemented.";
    res.status(501).send({ "message": message });
};

exports.NOT_FOUND = (req, res) => {
    const message = res.locals.errorMessage || "Not Found.";
    res.status(404).send({ "message": message });
};
