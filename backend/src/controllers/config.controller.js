// provides public configuration data like bank details
exports.getBankDetails = async (req, res, next) => {
  try {
    // keeping bank details centralized in the backend for security and maintainability
    const bankDetails = {
      bankName: "Bank of Ceylon",
      branch: "City Center",
      accountName: "Indoor Sports Complex (Pvt) Ltd",
      accountNumber: "0012 3456 7890 001",
    };

    res.json({ success: true, bankDetails });
  } catch (err) {
    next(err);
  }
};
