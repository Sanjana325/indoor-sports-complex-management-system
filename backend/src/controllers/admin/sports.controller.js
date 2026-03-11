const sportModel = require("../../models/sport.model");

exports.listSports = async (req, res, next) => {
    try {
        const search = String(req.query.search || "").trim();
        const rows = await sportModel.listSports(search);
        res.json({ sports: rows });
    } catch (err) {
        next(err);
    }
};

exports.createSport = async (req, res, next) => {
    try {
        const { sportName, colorCode } = req.body || {};
        const row = await sportModel.createSportIfNotExists(sportName, colorCode);
        if (!row) return res.status(400).json({ message: "Sport name is required" });
        res.status(201).json({ sport: row });
    } catch (err) {
        next(err);
    }
};

exports.deleteSport = async (req, res, next) => {
    try {
        const sportId = Number(req.params.sportId);
        if (!Number.isFinite(sportId)) return res.status(400).json({ message: "Invalid sport ID" });

        const success = await sportModel.deleteSport(sportId);
        if (!success) return res.status(404).json({ message: "Sport not found" });

        res.json({ message: "Sport deleted" });
    } catch (err) {
        if (err.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(400).json({ message: "Cannot delete sport because it is used by one or more courts or coaches." });
        }
        next(err);
    }
};

exports.updateSport = async (req, res, next) => {
    try {
        const sportId = Number(req.params.sportId);
        if (!Number.isFinite(sportId)) return res.status(400).json({ message: "Invalid sport ID" });

        const { sportName, colorCode } = req.body || {};
        if (!sportName) return res.status(400).json({ message: "Sport name is required" });

        const success = await sportModel.updateSport(sportId, sportName, colorCode);
        if (!success) return res.status(404).json({ message: "Sport not found or update failed" });

        // Fetch updated sport to return
        const updatedSport = await sportModel.getSportById(sportId);

        res.json({ message: "Sport updated successfully", sport: updatedSport });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "A sport with this name already exists." });
        }
        next(err);
    }
};
