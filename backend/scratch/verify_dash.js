const { getDashboardStats } = require("../src/controllers/admin/reports.controller");

async function testDashboardStats() {
    const mockRes = {
        json: (data) => {
            console.log("\n--- DASHBOARD DATA ---");
            console.log("TOTALS:", JSON.stringify(data.totals, null, 2));
            console.log("TREND:", data.charts.revenueTrend.length, "rows");
            console.log("BY SPORT:", data.charts.revenueBySport.length, "rows");
            console.log("BY COURT:", data.charts.revenueByCourt.length, "rows");
            if (data.charts.revenueBySport.length > 0) {
                console.log("SPORT DATA:", JSON.stringify(data.charts.revenueBySport[0], null, 2));
            }
        }
    };

    const mockNext = (err) => {
        if (err) console.error("FAILED:", err.message);
    };

    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(); monthStart.setDate(1);
    const start = monthStart.toISOString().split('T')[0];
    
    console.log(`\n>>> Testing range: ${start} to ${today} (THIS MONTH)`);
    await getDashboardStats({ query: { start, end: today } }, mockRes, mockNext);

    process.exit(0);
}

testDashboardStats();
