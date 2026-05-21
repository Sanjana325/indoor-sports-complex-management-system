const sportModel = require("../../models/sport.model");

// get all sports for admin list
exports.listSports = async (req, res, next) => {
    try {
        const search = String(req.query.search || "").trim();
        const rows = await sportModel.listSports(search);
        // format output for frontend display
        const mapped = rows.map(r => ({
            ...r,
            id: `SPT-${String(r.SportID).padStart(6, '0')}`,
            rawId: r.SportID
        }));
        res.json({ sports: mapped });
    } catch (err) {
        next(err);
    }
};

// add a new sport type to the system
exports.createSport = async (req, res, next) => {
    try {
        const { sportName, colorCode, isBookable } = req.body || {};
        const isBookableVal = isBookable === undefined ? 1 : (isBookable ? 1 : 0);
        const row = await sportModel.createSport(sportName, colorCode, isBookableVal);
        if (!row) return res.status(400).json({ message: "Sport name is required" });
        res.status(201).json({ sport: row });
    } catch (err) {
        // prevent duplicate sport names
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "A sport with this name already exists." });
        }
        next(err);
    }
};

// remove a sport (if not in use)
exports.deleteSport = async (req, res, next) => {
    try {
        const sportId = Number(req.params.sportId);
        if (!Number.isFinite(sportId)) return res.status(400).json({ message: "Invalid sport ID" });

        const success = await sportModel.deleteSport(sportId);
        if (!success) return res.status(404).json({ message: "Sport not found" });

        res.json({ message: "Sport deleted" });
    } catch (err) {
        // check if sport is linked to other records before deleting
        if (err.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(400).json({ message: "Cannot delete sport because it is used by one or more courts or coaches." });
        }
        next(err);
    }
};

// modify an existing sport's details
exports.updateSport = async (req, res, next) => {
    try {
        const sportId = Number(req.params.sportId);
        if (!Number.isFinite(sportId)) return res.status(400).json({ message: "Invalid sport ID" });

        const { sportName, colorCode, isBookable } = req.body || {};
        if (!sportName) return res.status(400).json({ message: "Sport name is required" });
 
        const isBookableVal = isBookable === undefined ? 1 : (isBookable ? 1 : 0);
        const success = await sportModel.updateSport(sportId, sportName, colorCode, isBookableVal);
        if (!success) return res.status(404).json({ message: "Sport not found or update failed" });

        // fetch updated sport to return
        const updatedSport = await sportModel.getSportById(sportId);

        res.json({ message: "Sport updated successfully", sport: updatedSport });
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "A sport with this name already exists." });
        }
        next(err);
    }
};

