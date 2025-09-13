import dotenv from "dotenv";

dotenv.config();

// PayOS Configuration
const payosConfig = {
    // Required environment variables
    clientId: process.env.PAYOS_CLIENT_ID,
    apiKey: process.env.PAYOS_API_KEY,
    checksumKey: process.env.PAYOS_CHECKSUM_KEY,

    // Optional configuration
    baseUrl: process.env.PAYOS_BASE_URL || "https://api-merchant.payos.vn",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

    // Payment settings
    paymentTimeout: 15 * 60 * 1000, // 15 minutes
    currency: "VND",

    // Webhook settings
    webhookUrl: process.env.PAYOS_WEBHOOK_URL || `${process.env.BACKEND_URL || "http://localhost:8080"}/api/payment/webhook`,

    // Return URLs
    returnUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/success`,
    cancelUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/cancel`,
};

// Validate required configuration
const validateConfig = () => {
    const required = ["clientId", "apiKey", "checksumKey"];
    const missing = required.filter(key => !payosConfig[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required PayOS configuration: ${missing.join(", ")}`);
    }

    return true;
};

// Get configuration
const getConfig = () => {
    validateConfig();
    return payosConfig;
};

// Get headers for PayOS API calls
const getHeaders = () => {
    return {
        "Content-Type": "application/json",
        "x-client-id": payosConfig.clientId,
        "x-api-key": payosConfig.apiKey,
    };
};

// Get webhook URL
const getWebhookUrl = () => {
    return payosConfig.webhookUrl;
};

// Get return URLs
const getReturnUrls = () => {
    return {
        returnUrl: payosConfig.returnUrl,
        cancelUrl: payosConfig.cancelUrl,
    };
};

export default {
    getConfig,
    getHeaders,
    getWebhookUrl,
    getReturnUrls,
    validateConfig,
};
