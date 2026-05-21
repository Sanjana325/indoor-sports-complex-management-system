const { getEnrollmentsReport, getAttendanceReport } = require("../src/controllers/admin/reports.controller");

async function testReports() {
    const mockRes = {
        json: (data) => {
            console.log("\n--- RESPONSE DATA ---");
            console.log("Record Count:", data.reports.length);
            if (data.reports.length > 0) {
                console.log("Sample Record ClassName:", data.reports[0].className || data.reports[0].ClassName);
            }
            console.log("KPIs:", JSON.stringify(data.kpis, null, 2));
        }
    };

    const mockNext = (err) => {
        if (err) {
            console.error("REPORT FAILED WITH ERROR:", err.message);
        }
    };

    const today = new Date();
    const start = new Date(today);
    start.setMonth(today.getMonth() - 6); // Look back 6 months to ensure we find data

    const req = {
        query: {
            start: start.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
        }
    };

    console.log(`Testing with range: ${req.query.start} to ${req.query.end}`);

    console.log("\n>>> Testing ENROLLMENTS report...");
    await getEnrollmentsReport(req, mockRes, mockNext);

    console.log("\n>>> Testing ATTENDANCE report...");
    await getAttendanceReport(req, mockRes, mockNext);

    process.exit(0);
}

testReports();
