const blockedSlotModel = require("../../models/blockedSlot.model");

exports.listBlockedSlots = async (req, res, next) => {
    try {
        const search = req.query.search || "";
        const slots = await blockedSlotModel.listBlockedSlots(search);
        res.json({ slots });
    } catch (err) {
        next(err);
    }
};

exports.createBlockedSlot = async (req, res, next) => {
    try {
        const { courtId, startDateTime, endDateTime, reason } = req.body;

        if (!courtId || !startDateTime || !endDateTime || !reason) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const start = new Date(startDateTime);
        const end = new Date(endDateTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        if (end <= start) {
            return res.status(400).json({ message: "End time must be after start time" });
        }

        const blockedSlotId = await blockedSlotModel.createBlockedSlot({
            courtId,
            startDateTime,
            endDateTime,
            reason,
            createdBy: req.user.UserID
        });

        res.status(201).json({ message: "Blocked slot created", blockedSlotId });
    } catch (err) {
        next(err);
    }
};

exports.updateBlockedSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { courtId, startDateTime, endDateTime, reason } = req.body;

        if (!id) return res.status(400).json({ message: "ID is required" });

        const start = startDateTime ? new Date(startDateTime) : null;
        const end = endDateTime ? new Date(endDateTime) : null;

        if (start && end && end <= start) {
            return res.status(400).json({ message: "End time must be after start time" });
        }

        const success = await blockedSlotModel.updateBlockedSlot(id, {
            courtId,
            startDateTime,
            endDateTime,
            reason
        });

        if (!success) {
            return res.status(404).json({ message: "Blocked slot not found" });
        }

        res.json({ message: "Blocked slot updated" });
    } catch (err) {
        next(err);
    }
};

exports.deleteBlockedSlot = async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "ID is required" });

        const success = await blockedSlotModel.deleteBlockedSlot(id);
        if (!success) {
            return res.status(404).json({ message: "Blocked slot not found" });
        }

        res.json({ message: "Blocked slot deleted" });
    } catch (err) {
        next(err);
    }
};
