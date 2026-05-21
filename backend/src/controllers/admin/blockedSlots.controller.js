const blockedSlotModel = require("../../models/blockedSlot.model");

// get all blocked court slots for admin dashboard
exports.listBlockedSlots = async (req, res, next) => {
    try {
        // get search query from request
        const search = req.query.search || "";
        // fetch blocked slots from database
        const slots = await blockedSlotModel.listBlockedSlots(search);
        
        // format slot data for frontend display
        const mapped = slots.map(s => ({
            ...s,
            id: `BLK-${String(s.blockedSlotId).padStart(6, '0')}`,
            rawId: s.blockedSlotId,
            courtIdStr: `CRT-${String(s.courtId).padStart(6, '0')}`,
            adminIdStr: `ADM-${String(s.createdBy).padStart(6, '0')}`
        }));

        // send response with formatted slots
        res.json({ slots: mapped });
    } catch (err) {
        next(err);
    }
};

// block a specific court timeslot
exports.createBlockedSlot = async (req, res, next) => {
    try {
        // extract data from request body
        const { courtId, startDateTime, endDateTime, reason } = req.body;

        // validate required fields
        if (!courtId || !startDateTime || !endDateTime || !reason) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        // validate date formats
        const start = new Date(startDateTime);
        const end = new Date(endDateTime);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            return res.status(400).json({ message: "Invalid date format" });
        }

        // prevent end time before start time
        if (end <= start) {
            return res.status(400).json({ message: "End time must be after start time" });
        }

        // prevent blocking time in the past
        if (start < new Date()) {
            return res.status(400).json({ message: "Cannot block court time in the past." });
        }

        // format for MySQL comparison (using space instead of T to avoid timezone confusion)
        const startStr = startDateTime.replace('T', ' ');
        const endStr = endDateTime.replace('T', ' ');

        // 1. Check for overlapping bookings, classes, or other blocks
        const conflict = await blockedSlotModel.checkConflicts(courtId, startStr, endStr);
        if (conflict.conflict) {
            let detail = "";
            if (conflict.type === 'booking') detail = `Conflict with Booking ID: ${conflict.id}`;
            else if (conflict.type === 'class') detail = `Conflict with Class: ${conflict.title}`;
            else if (conflict.type === 'blocked_slot') detail = `Conflict with an existing Blocked Slot (ID: ${conflict.id})`;

            return res.status(409).json({ 
                message: "Cannot block slot. Overlaps with an existing activity.",
                conflictDetail: detail 
            });
        }

        // save blocked slot to database
        const blockedSlotId = await blockedSlotModel.createBlockedSlot({
            courtId,
            startDateTime,
            endDateTime,
            reason,
            createdBy: req.user.UserID
        });

        // send success response
        res.status(201).json({ message: "Blocked slot created", blockedSlotId });
    } catch (err) {
        next(err);
    }
};

// modify an existing court blockage
exports.updateBlockedSlot = async (req, res, next) => {
    try {
        // extract parameters and body data
        const { id } = req.params;
        const { courtId, startDateTime, endDateTime, reason } = req.body;

        if (!id) return res.status(400).json({ message: "ID is required" });

        // format for MySQL comparison (using space instead of T to avoid timezone confusion)
        const startStr = startDateTime ? startDateTime.replace('T', ' ') : null;
        const endStr = endDateTime ? endDateTime.replace('T', ' ') : null;

        // validate times and dates
        const start = startStr ? new Date(startStr) : null;
        const end = endStr ? new Date(endStr) : null;

        if (start && end && end <= start) {
            return res.status(400).json({ message: "End time must be after start time" });
        }

        if (start && start < new Date()) {
            return res.status(400).json({ message: "Cannot move court blockage into the past." });
        }

        // 1. If date/time/court changed, check for conflicts
        if (courtId || startStr || endStr) {
            const [currentSlot] = await require("../../config/db").pool.query(
                "SELECT CourtID, StartDateTime, EndDateTime FROM blockedslot WHERE BlockedSlotID = ?",
                [id]
            );

            if (currentSlot && currentSlot[0]) {
                const cId = courtId || currentSlot[0].CourtID;
                const sDt = startStr || currentSlot[0].StartDateTime;
                const eDt = endStr || currentSlot[0].EndDateTime;

                const conflict = await blockedSlotModel.checkConflicts(cId, sDt, eDt, id);
                if (conflict.conflict) {
                    let detail = "";
                    if (conflict.type === 'booking') detail = `Conflict with Booking ID: ${conflict.id}`;
                    else if (conflict.type === 'class') detail = `Conflict with Class: ${conflict.title}`;
                    else if (conflict.type === 'blocked_slot') detail = `Conflict with an existing Blocked Slot (ID: ${conflict.id})`;

                    return res.status(409).json({ 
                        message: "Update failed. New time/court overlaps with an existing activity.",
                        conflictDetail: detail 
                    });
                }
            }
        }

        // update record in database
        const success = await blockedSlotModel.updateBlockedSlot(id, {
            courtId,
            startDateTime,
            endDateTime,
            reason
        });

        // handle case where slot is not found
        if (!success) {
            return res.status(404).json({ message: "Blocked slot not found" });
        }

        // send success response
        res.json({ message: "Blocked slot updated" });
    } catch (err) {
        next(err);
    }
};

// remove a court blockage and free up the time
exports.deleteBlockedSlot = async (req, res, next) => {
    try {
        // extract id from request
        const { id } = req.params;
        if (!id) return res.status(400).json({ message: "ID is required" });

        // delete record from database
        const success = await blockedSlotModel.deleteBlockedSlot(id);
        if (!success) {
            return res.status(404).json({ message: "Blocked slot not found" });
        }

        // send success response
        res.json({ message: "Blocked slot deleted" });
    } catch (err) {
        next(err);
    }
};

