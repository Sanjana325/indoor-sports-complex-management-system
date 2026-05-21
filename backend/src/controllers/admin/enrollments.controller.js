const enrollmentModel = require("../../models/enrollment.model");
const emailService = require("../../services/email.service");

// get all class enrollments for administrative dashboard
exports.listEnrollments = async (req, res, next) => {
    try {
        // fetch enrollment data from database
        const rows = await enrollmentModel.findAll();

        // format data for frontend display
        const enrollments = rows.map(r => {
            // format enrollment date
            const dateStr = r.EnrolledAt ? new Date(r.EnrolledAt).toISOString().slice(0, 10) : "—";

            // determine current billing period
            let currentPeriod = "—";
            if (r.BillingType === 'ONE_TIME') {
                currentPeriod = "One-time";
            } else if (r.PeriodMonth) {
                const d = new Date(r.PeriodMonth);
                if (!Number.isNaN(d.getTime())) {
                    currentPeriod = d.toISOString().slice(0, 7); // "YYYY-MM"
                }
            }

            return {
                id: r.EnrollmentID,
                enrollmentId: `ENR-${String(r.EnrollmentID).padStart(6, '0')}`,
                playerName: `${r.FirstName} ${r.LastName}`,
                className: r.ClassName,
                billingType: r.BillingType,
                currentPeriod: currentPeriod,
                currentFeeStatus: r.FeeStatus || '—',
                enrolledAt: dateStr,
                status: r.EnrollmentStatus
            };
        });

        // send response with formatted data
        res.json({ enrollments });
    } catch (err) {
        next(err);
    }
};

// cancel a student's enrollment in a class
exports.cancelEnrollment = async (req, res, next) => {
    try {
        // extract parameters from request
        const enrollmentId = req.params.id;
        const { reason } = req.body;

        // check if enrollment exists
        const enrollment = await enrollmentModel.findById(enrollmentId);
        if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

        // update enrollment status to cancelled
        await enrollmentModel.updateStatus(enrollmentId, 'CANCELLED');

        // send cancellation notification email
        emailService.sendEnrollmentCancelledEmail({
            toEmail: enrollment.Email,
            toName: `${enrollment.FirstName} ${enrollment.LastName}`,
            className: enrollment.ClassName,
            reason: reason || "Administrative decision"
        }).catch(err => console.error("Failed to send cancellation email:", err));

        // send success response
        res.json({ message: "Enrollment cancelled successfully" });
    } catch (err) {
        next(err);
    }
};

