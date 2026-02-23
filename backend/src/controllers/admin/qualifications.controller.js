const coachModel = require("../../models/coach.model");

exports.listQualifications = async (req, res, next) => {
    try {
        const search = String(req.query.search || "").trim();
        const rows = await coachModel.listQualifications(search);
        res.json({ qualifications: rows });
    } catch (err) {
        next(err);
    }
};

exports.createQualification = async (req, res, next) => {
    try {
        const { qualificationName } = req.body || {};
        const row = await coachModel.createQualificationIfNotExists(qualificationName);
        if (!row) return res.status(400).json({ message: "Qualification name is required" });
        res.status(201).json({ qualification: row });
    } catch (err) {
        next(err);
    }
};
