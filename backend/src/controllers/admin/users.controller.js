const userModel = require("../../models/user.model");
const coachModel = require("../../models/coach.model");
const { hashPassword } = require("../../utils/password");
const { generateTempPassword } = require("../../utils/randomPassword");
const { pool } = require("../../config/db");

function isValidEmail(email) {
    return typeof email === "string" && email.includes("@") && email.includes(".");
}

function canAdminManageTargetRole(targetRole) {
    return targetRole === "STAFF" || targetRole === "COACH" || targetRole === "PLAYER";
}

function uniqueNonEmptyStrings(list) {
    const arr = Array.isArray(list) ? list : [];
    const cleaned = arr.map((x) => String(x || "").trim()).filter(Boolean);
    return Array.from(new Set(cleaned));
}

function uniquePositiveInts(list) {
    const arr = Array.isArray(list) ? list : [];
    const nums = arr.map((x) => Number(x)).filter((n) => Number.isFinite(n) && n > 0);
    return Array.from(new Set(nums));
}

function buildCoachSpecializationsPayload(body) {
    const sportIds = uniquePositiveInts(body.sportIds);
    const specializations = uniqueNonEmptyStrings(body.specializations);

    const legacySpecialization = String(body.specialization || "").trim();
    if (!specializations.length && legacySpecialization) {
        specializations.push(legacySpecialization);
    }

    return { sportIds, specializations };
}

function buildCoachQualificationsPayload(body) {
    const qualificationIds = uniquePositiveInts(body.qualificationIds);
    const qualifications = uniqueNonEmptyStrings(body.qualifications);
    return { qualificationIds, qualifications };
}

exports.listUsers = async (req, res, next) => {
    try {
        const rows = await userModel.listAllForAdmin();
        res.json({ users: rows });
    } catch (err) {
        next(err);
    }
};

exports.createUser = async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
        const { firstName, lastName, email, phoneNumber, role } = req.body || {};

        if (!firstName || !lastName || !email || !phoneNumber || !role) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Invalid email" });
        }

        const allowedForAdmin = ["STAFF", "COACH", "PLAYER"];
        const allowedForSuperAdmin = ["ADMIN", "STAFF", "COACH", "PLAYER"];
        const requesterRole = req.user.Role;

        if (requesterRole === "SUPER_ADMIN") {
            if (!allowedForSuperAdmin.includes(role)) {
                return res.status(400).json({ message: "Role not allowed for this endpoint" });
            }
        } else {
            if (!allowedForAdmin.includes(role)) {
                return res.status(403).json({ message: "Only SUPER_ADMIN can create ADMIN" });
            }
        }

        const { sportIds, specializations } = buildCoachSpecializationsPayload(req.body || {});
        const { qualificationIds, qualifications } = buildCoachQualificationsPayload(req.body || {});

        if (role === "COACH") {
            const hasSports = sportIds.length > 0 || specializations.length > 0;
            const hasQualifications = qualificationIds.length > 0 || qualifications.length > 0;

            if (!hasSports) return res.status(400).json({ message: "At least one specialization is required for COACH" });
            if (!hasQualifications) return res.status(400).json({ message: "At least one qualification is required for COACH" });
        }

        const exists = await userModel.emailExists(email);
        if (exists) return res.status(409).json({ message: "Email already exists" });

        const tempPassword = generateTempPassword();
        const passwordHash = await hashPassword(tempPassword);

        await conn.beginTransaction();

        const userId = await userModel.createUser(
            {
                firstName,
                lastName,
                email,
                passwordHash,
                phoneNumber,
                role,
                mustChangePassword: true
            },
            conn
        );

        let coachId = null;

        if (role === "COACH") {
            coachId = await coachModel.createCoach({ userId }, conn);

            if (sportIds.length) {
                await coachModel.setCoachSportsByIds(coachId, sportIds, conn);
            } else {
                await coachModel.setCoachSportsByNames(coachId, specializations, conn);
            }

            if (qualificationIds.length) {
                await coachModel.setCoachQualificationsByIds(coachId, qualificationIds, conn);
            } else {
                await coachModel.setCoachQualificationsByNames(coachId, qualifications, conn);
            }
        }

        await conn.commit();

        res.status(201).json({
            message: "User created",
            user: { userId, role, email, coachId },
            mustChangePassword: true,
            tempPassword
        });
    } catch (err) {
        try {
            await conn.rollback();
        } catch (e) { }
        next(err);
    } finally {
        conn.release();
    }
};

exports.updateUser = async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
        const targetUserId = Number(req.params.userId);
        if (!Number.isFinite(targetUserId)) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        const { firstName, lastName, email, phoneNumber, role } = req.body || {};

        if (!firstName || !lastName || !email || !phoneNumber || !role) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({ message: "Invalid email" });
        }

        const target = await userModel.findById(targetUserId);
        if (!target) return res.status(404).json({ message: "User not found" });

        const requesterRole = req.user.Role;

        if (requesterRole !== "SUPER_ADMIN" && (target.Role === "ADMIN" || target.Role === "SUPER_ADMIN")) {
            return res.status(403).json({ message: "You are not allowed to edit this user" });
        }

        const allowedForAdmin = ["STAFF", "COACH", "PLAYER"];
        const allowedForSuperAdmin = ["ADMIN", "STAFF", "COACH", "PLAYER"];

        if (requesterRole === "SUPER_ADMIN") {
            if (!allowedForSuperAdmin.includes(role)) {
                return res.status(400).json({ message: "Role not allowed" });
            }
        } else {
            if (!allowedForAdmin.includes(role)) {
                return res.status(403).json({ message: "Only SUPER_ADMIN can assign ADMIN role" });
            }
        }

        const { sportIds, specializations } = buildCoachSpecializationsPayload(req.body || {});
        const { qualificationIds, qualifications } = buildCoachQualificationsPayload(req.body || {});

        if (role === "COACH") {
            const hasSports = sportIds.length > 0 || specializations.length > 0;
            const hasQualifications = qualificationIds.length > 0 || qualifications.length > 0;

            if (!hasSports) return res.status(400).json({ message: "At least one specialization is required for COACH" });
            if (!hasQualifications) return res.status(400).json({ message: "At least one qualification is required for COACH" });
        }

        const emailTaken = await userModel.emailExistsExceptUser(email, targetUserId);
        if (emailTaken) return res.status(409).json({ message: "Email already exists" });

        await conn.beginTransaction();

        await userModel.updateUserById(
            targetUserId,
            {
                firstName,
                lastName,
                email,
                phoneNumber,
                role
            },
            conn
        );

        const wasCoach = target.Role === "COACH";
        const willBeCoach = role === "COACH";

        if (wasCoach && willBeCoach) {
            const coachId = await coachModel.getCoachIdByUserId(targetUserId, conn);
            if (coachId) {
                if (sportIds.length) await coachModel.setCoachSportsByIds(coachId, sportIds, conn);
                else await coachModel.setCoachSportsByNames(coachId, specializations, conn);

                if (qualificationIds.length) await coachModel.setCoachQualificationsByIds(coachId, qualificationIds, conn);
                else await coachModel.setCoachQualificationsByNames(coachId, qualifications, conn);
            }
        } else if (!wasCoach && willBeCoach) {
            const coachId = await coachModel.createCoach({ userId: targetUserId }, conn);

            if (sportIds.length) await coachModel.setCoachSportsByIds(coachId, sportIds, conn);
            else await coachModel.setCoachSportsByNames(coachId, specializations, conn);

            if (qualificationIds.length) await coachModel.setCoachQualificationsByIds(coachId, qualificationIds, conn);
            else await coachModel.setCoachQualificationsByNames(coachId, qualifications, conn);
        } else if (wasCoach && !willBeCoach) {
            await coachModel.deleteCoachAndLinksByUserId(targetUserId, conn);
        }

        await conn.commit();

        res.json({
            message: "User updated",
            user: { userId: targetUserId, role, email }
        });
    } catch (err) {
        try {
            await conn.rollback();
        } catch (e) { }
        next(err);
    } finally {
        conn.release();
    }
};

exports.disableUser = async (req, res, next) => {
    try {
        const targetUserId = Number(req.params.userId);
        if (!Number.isFinite(targetUserId)) return res.status(400).json({ message: "Invalid user id" });

        if (targetUserId === req.user.UserID) {
            return res.status(400).json({ message: "You cannot disable your own account" });
        }

        const target = await userModel.findById(targetUserId);
        if (!target) return res.status(404).json({ message: "User not found" });

        const requesterRole = req.user.Role;

        if (requesterRole !== "SUPER_ADMIN") {
            if (!canAdminManageTargetRole(target.Role)) {
                return res.status(403).json({ message: "You are not allowed to disable this user" });
            }
        }

        if (target.Role === "SUPER_ADMIN") {
            const activeCount = await userModel.countActiveSuperAdmins();
            if (activeCount <= 1) {
                return res.status(400).json({ message: "Cannot disable the last active SUPER_ADMIN" });
            }
        }

        await userModel.setActiveById(targetUserId, false);
        res.json({ message: "User disabled" });
    } catch (err) {
        next(err);
    }
};

exports.enableUser = async (req, res, next) => {
    try {
        const targetUserId = Number(req.params.userId);
        if (!Number.isFinite(targetUserId)) return res.status(400).json({ message: "Invalid user id" });

        const target = await userModel.findById(targetUserId);
        if (!target) return res.status(404).json({ message: "User not found" });

        const requesterRole = req.user.Role;

        if (requesterRole !== "SUPER_ADMIN") {
            if (!canAdminManageTargetRole(target.Role)) {
                return res.status(403).json({ message: "You are not allowed to enable this user" });
            }
        }

        await userModel.setActiveById(targetUserId, true);
        res.json({ message: "User enabled" });
    } catch (err) {
        next(err);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const targetUserId = Number(req.params.userId);
        if (!Number.isFinite(targetUserId)) return res.status(400).json({ message: "Invalid user id" });

        if (targetUserId === req.user.UserID) {
            return res.status(400).json({ message: "You cannot remove your own account" });
        }

        const target = await userModel.findById(targetUserId);
        if (!target) return res.status(404).json({ message: "User not found" });

        if (target.Role === "SUPER_ADMIN") {
            const activeCount = await userModel.countActiveSuperAdmins();
            if (activeCount <= 1) {
                return res.status(400).json({ message: "Cannot remove the last active SUPER_ADMIN" });
            }
        }

        await userModel.deleteUserHardById(targetUserId);
        res.json({ message: "User removed" });
    } catch (err) {
        next(err);
    }
};
