const crypto = require("crypto");
const env = require("../config/env");

/**
 * Generate MD5 hash for PayHere payment initiation.
 * Formula: UpperCase(MD5(merchant_id + order_id + amount + currency + UpperCase(MD5(merchant_secret))))
 * 
 * @param {string|number} orderId - The unique ID for the order (PaymentID in our case)
 * @param {number|string} amount - The transaction amount (formatted to 2 decimal places if string)
 * @param {string} currency - The currency code (e.g., 'LKR')
 * @returns {string} The formatted hash
 */
function generatePaymentHash(orderId, amount, currency) {
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_SECRET;

    if (!merchantId || !merchantSecret) {
        throw new Error("PayHere credentials are not configured in environment variables.");
    }

    // Amount must be formatted to 2 decimal places if it's not already
    const formattedAmount = Number(amount).toLocaleString('en-us', { minimumFractionDigits: 2, useGrouping: false });

    const hashedSecret = crypto.createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
    const mainString = merchantId + orderId + formattedAmount + currency + hashedSecret;
    
    return crypto.createHash("md5").update(mainString).digest("hex").toUpperCase();
}

/**
 * Verify PayHere notification hash (md5sig).
 * Formula: UpperCase(MD5(merchant_id + order_id + payhere_amount + payhere_currency + status_code + UpperCase(MD5(merchant_secret))))
 * 
 * @param {Object} payload - The body of the POST request from PayHere
 * @returns {boolean} True if the hash is valid
 */
function verifyNotificationHash(payload) {
    const {
        merchant_id,
        order_id,
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig
    } = payload;

    const merchantSecret = process.env.PAYHERE_SECRET;

    if (!merchantSecret) {
        throw new Error("PayHere secret is not configured in environment variables.");
    }

    const hashedSecret = crypto.createHash("md5").update(merchantSecret).digest("hex").toUpperCase();
    const mainString = merchant_id + order_id + payhere_amount + payhere_currency + status_code + hashedSecret;
    
    const expectedSig = crypto.createHash("md5").update(mainString).digest("hex").toUpperCase();

    return expectedSig === md5sig;
}

module.exports = {
    generatePaymentHash,
    verifyNotificationHash
};
