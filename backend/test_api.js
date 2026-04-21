const { getPaymentsReport } = require('./src/controllers/admin/reports.controller');

const req = {
    query: {
        start: '2020-01-01',
        end: '2030-01-01',
        category: 'ALL'
    }
};

const res = {
    json: (data) => console.log("SUCCESS length:", data.reports.length),
    status: (code) => ({ json: (d) => console.log('HTTP', code, d) })
};

console.log("running test");
getPaymentsReport(req, res, console.error);
