const courtModel = require("../../models/court.model");
const { pool } = require("../../config/db");

function uniquePositiveInts(list) {
    const arr = Array.isArray(list) ? list : [];
    const nums = arr.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
    return Array.from(new Set(nums));
}

exports.listCourts = async (req, res, next) => {
    try {
        const search = String(req.query.search || "").trim();
        const rows = await courtModel.listCourts(search);
        res.json({ courts: rows });
    } catch (err) {
        next(err);
    }
};

exports.createCourt = async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
        const { name, capacity, pricePerHour, sportIds, status } = req.body || {};

        const nm = String(name || "").trim();
        const capNum = Number(capacity);
        const priceNum = Number(pricePerHour);
        const st = status ? String(status) : "AVAILABLE";

        if (!nm) return res.status(400).json({ message: "Court name is required" });
        if (!Number.isFinite(capNum) || capNum <= 0) return res.status(400).json({ message: "Capacity must be a positive number" });
        if (!Number.isFinite(priceNum) || priceNum <= 0) return res.status(400).json({ message: "Price per hour must be a positive number" });
        if (!["AVAILABLE", "BOOKED", "MAINTENANCE"].includes(st)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const sportIdList = uniquePositiveInts(sportIds);
        if (sportIdList.length === 0) {
            return res.status(400).json({ message: "At least one valid sport is required" });
        }

        await conn.beginTransaction();

        const courtId = await courtModel.createCourt(
            { name: nm, capacity: capNum, pricePerHour: priceNum, status: st },
            conn
        );

        await courtModel.addSportsToCourt(courtId, sportIdList, conn);

        await conn.commit();

        res.status(201).json({ message: "Court created", courtId });
    } catch (err) {
        try {
            await conn.rollback();
        } catch (e) { }
        next(err);
    } finally {
        conn.release();
    }
};

exports.updateCourt = async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
        const courtId = Number(req.params.courtId);
        if (!Number.isFinite(courtId)) return res.status(400).json({ message: "Invalid court ID" });

        const { name, capacity, pricePerHour, status, sportIds } = req.body || {};

        const nm = typeof name === "string" ? name.trim() : undefined;
        const capNum = capacity !== undefined ? Number(capacity) : undefined;
        const priceNum = pricePerHour !== undefined ? Number(pricePerHour) : undefined;
        const st = typeof status === "string" ? status : undefined;

        if (nm !== undefined && !nm) return res.status(400).json({ message: "Court name is required" });
        if (capNum !== undefined && (!Number.isFinite(capNum) || capNum <= 0)) return res.status(400).json({ message: "Capacity must be a positive number" });
        if (priceNum !== undefined && (!Number.isFinite(priceNum) || priceNum <= 0)) return res.status(400).json({ message: "Price per hour must be a positive number" });
        if (st !== undefined && !["AVAILABLE", "BOOKED", "MAINTENANCE"].includes(st)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const sportIdList = sportIds !== undefined ? uniquePositiveInts(sportIds) : null;
        if (sportIdList && sportIdList.length === 0) {
            return res.status(400).json({ message: "At least one valid sport is required" });
        }

        await conn.beginTransaction();

        const updated = await courtModel.updateCourt(
            courtId,
            { name: nm, capacity: capNum, pricePerHour: priceNum, status: st },
            conn
        );

        if (!updated) {
            await conn.rollback();
            return res.status(404).json({ message: "Court not found" });
        }

        if (sportIdList) {
            await courtModel.replaceCourtSports(courtId, sportIdList, conn);
        }

        await conn.commit();
        res.json({ message: "Court updated" });
    } catch (err) {
        try {
            await conn.rollback();
        } catch (e) { }
        next(err);
    } finally {
        conn.release();
    }
};

exports.deleteCourt = async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
        const courtId = Number(req.params.courtId);
        if (!Number.isFinite(courtId)) return res.status(400).json({ message: "Invalid court ID" });

        await conn.beginTransaction();

        const success = await courtModel.deleteCourtHard(courtId, conn);
        if (!success) {
            await conn.rollback();
            return res.status(404).json({ message: "Court not found" });
        }

        await conn.commit();
        res.json({ message: "Court deleted" });
    } catch (err) {
        try {
            await conn.rollback();
        } catch (e) { }

        if (err.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(400).json({ message: "Cannot delete court because it is used by bookings, blocked slots, or classes." });
        }

        next(err);
    } finally {
        conn.release();
    }
};
