const { pool } = require("../config/db");

// fetch all bookings with player and court details for admin view
async function listAllForAdmin() {
  const [rows] = await pool.query(
    `SELECT b.BookingID, b.StartDateTime, b.EndDateTime, b.Status, b.CreatedAt,
            b.UserID, b.CourtID,
            c.CourtName, c.PricePerHour, u.FirstName, u.LastName, u.PhoneNumber, u.Email,
            s.SportName, s.ColorCode,
            p.PaymentID, p.Method as PaymentMethod
     FROM booking b
     JOIN court c ON b.CourtID = c.CourtID
     JOIN useraccount u ON b.UserID = u.UserID
     JOIN sport s ON b.SportID = s.SportID
     LEFT JOIN bookingpayment bp ON b.BookingID = bp.BookingID
     LEFT JOIN payment p ON bp.PaymentID = p.PaymentID
     ORDER BY b.CreatedAt DESC`
  );
  return rows;
}

// get booking history for a specific player
async function listByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT b.BookingID, b.StartDateTime, b.EndDateTime, b.Status, b.CreatedAt,
            c.CourtName, s.SportName,
            p.VerifiedAt AS ConfirmedAt
     FROM booking b
     JOIN court c ON b.CourtID = c.CourtID
     JOIN sport s ON b.SportID = s.SportID
     LEFT JOIN bookingpayment bp ON b.BookingID = bp.BookingID
     LEFT JOIN payment p ON bp.PaymentID = p.PaymentID
     WHERE b.UserID = ?
     ORDER BY b.CreatedAt DESC`,
    [userId]
  );
  return rows;
}

// find a specific booking by ID
async function findById(bookingId, conn = pool) {
  const [rows] = await conn.query(
    `SELECT * FROM booking WHERE BookingID = ?`,
    [bookingId]
  );
  return rows.length ? rows[0] : null;
}

// verify if a time slot is free (no other bookings, blocks, or classes)
async function checkConflicts(courtId, startDateTime, endDateTime, conn = pool) {
  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  // 1. check for overlapping bookings
  const [bookings] = await conn.query(
    `SELECT BookingID FROM booking 
     WHERE CourtID = ? AND Status IN ('PENDING_PAYMENT', 'WAITING_VERIFICATION', 'CONFIRMED')
     AND (StartDateTime < ? AND EndDateTime > ?)`,
    [courtId, endDateTime, startDateTime]
  );
  if (bookings.length > 0) {
    return { conflict: true, message: "Conflict: This court is already booked during this time." };
  }

  // 2. check for overlapping blocked slots (maintenance/events)
  const [blocked] = await conn.query(
    `SELECT BlockedSlotID FROM blockedslot
     WHERE CourtID = ?
     AND (StartDateTime < ? AND EndDateTime > ?)`,
    [courtId, endDateTime, startDateTime]
  );
  if (blocked.length > 0) {
    return { conflict: true, message: "Conflict: This court is blocked for maintenance or a private event during this time." };
  }

  // 3. check for overlapping recurring classes
  const dayOfWeek = start.getDay(); 
  const dateStr = start.toISOString().split('T')[0];
  const timeStart = start.toTimeString().slice(0, 5);
  const timeEnd = end.toTimeString().slice(0, 5);

  const [classSlots] = await conn.query(
    `SELECT c.ClassID
     FROM class c
     JOIN class_court cc ON c.ClassID = cc.ClassID
     JOIN classschedule sch ON c.ClassID = sch.ClassID
     LEFT JOIN classscheduleday csd ON sch.ScheduleID = csd.ScheduleID
     LEFT JOIN classsession cs ON c.ClassID = cs.ClassID AND cs.SessionDate = ?
     WHERE cc.CourtID = ?
     AND c.Status = 'ACTIVE'
     AND c.StartDate <= ?
     AND (
         (sch.ScheduleType = 'ONE_TIME' AND sch.OneTimeDate = ?)
         OR
         (sch.ScheduleType = 'WEEKLY' AND csd.Weekday = ?)
     )
     AND (cs.Status IS NULL OR cs.Status != 'CANCELLED')
     AND TIME(?) < sch.EndTime
     AND TIME(?) > sch.StartTime`,
    [dateStr, courtId, dateStr, dateStr, dayOfWeek, timeStart, timeEnd]
  );
  if (classSlots.length > 0) {
    return { conflict: true, message: "Conflict: This court is occupied by a class during this time." };
  }

  return { conflict: false };
}

// save a new booking after checking for time conflicts
async function createBooking({ courtId, sportId, userId, startDateTime, endDateTime }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // lock the court record to prevent two people booking the same time simultaneously
    await connection.query("SELECT CourtID FROM court WHERE CourtID = ? FOR UPDATE", [courtId]);

    // re-verify availability inside transaction
    const conflictCheck = await checkConflicts(courtId, startDateTime, endDateTime, connection);
    if (conflictCheck.conflict) {
      await connection.rollback();
      return { success: false, conflict: true, message: conflictCheck.message };
    }

    const [result] = await connection.query(
      "INSERT INTO booking (CourtID, SportID, UserID, StartDateTime, EndDateTime, Status) VALUES (?, ?, ?, ?, ?, 'PENDING_PAYMENT')",
      [courtId, sportId, userId, startDateTime, endDateTime]
    );

    await connection.commit();
    return { success: true, bookingId: result.insertId };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// update booking status (e.g., CONFIRMED, CANCELLED)
async function updateStatus(bookingId, status, userId = null, conn = pool) {
  let query = "UPDATE booking SET Status = ? WHERE BookingID = ? AND Status != ?";
  let params = [status, bookingId, status];

  // verify ownership if userId is provided
  if (userId) {
    query += " AND UserID = ?";
    params.push(userId);
  }

  const [result] = await conn.query(query, params);
  return result.affectedRows > 0;
}

// get booking details and court price for payment calculation
async function getBookingWithPrice(bookingId, userId = null, conn = pool) {
  let sql = `
    SELECT b.BookingID, b.StartDateTime, b.EndDateTime, c.PricePerHour, c.CourtName, b.Status, b.UserID
    FROM booking b
    JOIN court c ON b.CourtID = c.CourtID
    WHERE b.BookingID = ?`;
  const params = [bookingId];

  if (userId) {
    sql += " AND b.UserID = ?";
    params.push(userId);
  }

  const [rows] = await conn.query(sql, params);
  return rows.length ? rows[0] : null;
}

module.exports = {
  listAllForAdmin,
  listByUserId,
  findById,
  checkConflicts,
  createBooking,
  updateStatus,
  getBookingWithPrice
};

