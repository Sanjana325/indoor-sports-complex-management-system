const crypto = require("crypto");

// create security hash for outgoing payments
function generatePaymentHash(orderId, amount, currency) {
    const merchantId = String(process.env.PAYHERE_MERCHANT_ID || "").trim();
    const merchantSecret = String(process.env.PAYHERE_MERCHANT_SECRET || "").trim();

    if (!merchantId || !merchantSecret) {
        throw new Error("PayHere credentials are not configured.");
    }

    const formattedAmount = Number(amount).toFixed(2);

    // 1. Hash the Merchant Secret and convert to Uppercase
    const hashedSecret = crypto
        .createHash("md5")
        .update(merchantSecret)
        .digest("hex")
        .toUpperCase();

    // 2. Construct the main string for the final hash
    // Formula: MerchantID + OrderID + Amount + Currency + HashedSecret
    const mainString =
        merchantId +
        String(orderId) +
        formattedAmount +
        currency +
        hashedSecret;

    // 3. Generate final MD5 and convert to Uppercase
    const finalHash = crypto
        .createHash("md5")
        .update(mainString)
        .digest("hex")
        .toUpperCase();

    console.log(`[PayHere Debug] Order: ${orderId}, Amount: ${formattedAmount}, Hash Start: ${finalHash.substring(0, 8)}`);
    // Log the sequence (excluding secret) to verify format
    console.log(`[PayHere Debug] Sequence: ${merchantId} + ${orderId} + ${formattedAmount} + ${currency} + [SECRET_HASH]`);
    
    return finalHash;
}

// validate hash signature from incoming payment notifications
function verifyNotificationHash(payload) {
    // extract data from payload
    const {
        merchant_id,
        order_id,
        payhere_amount,
        payhere_currency,
        status_code,
        md5sig
    } = payload;

    const merchantSecret = String(process.env.PAYHERE_MERCHANT_SECRET || "").trim();

    if (!merchantSecret) {
        throw new Error("PayHere secret not configured.");
    }

    // 1. Hash the Merchant Secret and convert to Uppercase
    const hashedSecret = crypto
        .createHash("md5")
        .update(merchantSecret)
        .digest("hex")
        .toUpperCase();

    // 2. Construct the notification string
    // Formula: MerchantID + OrderID + PayHereAmount + PayHereCurrency + StatusCode + HashedSecret
    // Ensure payhere_amount is formatted to 2 decimals as per PayHere spec
    const formattedAmount = Number(payhere_amount).toFixed(2);

    const mainString =
        String(merchant_id) +
        String(order_id) +
        formattedAmount +
        payhere_currency +
        String(status_code) +
        hashedSecret;

    // 3. Calculate expected MD5 and convert to Uppercase
    const expectedSig = crypto
        .createHash("md5")
        .update(mainString)
        .digest("hex")
        .toUpperCase();

    const isValid = expectedSig === md5sig;
    if (!isValid) {
        console.log(`[PayHere Debug] Sig Mismatch! Expected: ${expectedSig.substring(0,8)}, Received: ${md5sig.substring(0,8)}`);
        console.log(`[PayHere Debug] MainString: ${String(merchant_id)} + ${String(order_id)} + ${formattedAmount} + ${payhere_currency} + ${String(status_code)} + [SECRET]`);
    }

    return isValid;
}

module.exports = {
    generatePaymentHash,
    verifyNotificationHash
};