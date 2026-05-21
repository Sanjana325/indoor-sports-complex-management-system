const { testDbConnection } = require("../config/db");

// check if the server and database are running correctly
exports.checkHealth = async (req, res, next) => {
    try {
        await testDbConnection();
        res.json({
            status: "ok",
            service: "indoor-sports-complex-backend",
            db: "connected"
        });
    } catch (err) {
        next(err);
    }
};

