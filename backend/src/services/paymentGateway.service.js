const crypto = require("crypto");

function generatePaymentHash(orderId, amount, currency) {
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantId || !merchantSecret) {
        throw new Error("PayHere credentials are not configured.");
    }

    const formattedAmount = Number(amount).toFixed(2);

    const hashedSecret = crypto
        .createHash("md5")
        .update(merchantSecret)
        .digest("hex")
        .toUpperCase();

    const mainString =
        String(merchantId) +
        String(orderId) +
        formattedAmount +
        currency +
        hashedSecret;

    return crypto
        .createHash("md5")
        .update(mainString)
        .digest("hex")
        .toUpperCase();
}

function verifyNotificationHash(payload) {
    const {
        merchant_id,
        order_id,
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig
    } = payload;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;

    if (!merchantSecret) {
        throw new Error("PayHere secret not configured.");
    }

    const hashedSecret = crypto
        .createHash("md5")
        .update(merchantSecret)
        .digest("hex")
        .toUpperCase();

    const mainString =
        String(merchant_id) +
        String(order_id) +
        payhere_amount +
        payhere_currency +
        status_code +
        hashedSecret;

    const expectedSig = crypto
        .createHash("md5")
        .update(mainString)
        .digest("hex")
        .toUpperCase();

    return expectedSig === md5sig;
}

module.exports = {
    generatePaymentHash,
    verifyNotificationHash
};