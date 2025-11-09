/**
 * PayOS Utilities
 * Helper functions for PayOS integration
 */

/**
 * Generate PayOS-compliant description (max 25 characters)
 * @param {string} type - Transaction type
 * @param {string} id - MongoDB ObjectId or any identifier
 * @param {Object} options - Additional options
 * @returns {string} Short description
 */
export const generatePayOSDescription = (type, id, options = {}) => {
    // Get last 5 characters of ID for tracking
    const shortId = id.toString().slice(-5);

    // Description templates (max 25 chars)
    const templates = {
        service: `TT dv #${shortId}`, // Service payment (14 chars)
        package: `Mua goi #${shortId}`, // Package purchase (16 chars)
        deposit: `Dat coc #${shortId}`, // Deposit (17 chars)
        inspection: `Phi KT #${shortId}`, // Inspection fee (16 chars)
        renewal: `Gia han #${shortId}`, // Renewal (17 chars)
        subscription: `Dang ky #${shortId}`, // Subscription (18 chars)
        upfront: `Tam ung #${shortId}`, // Upfront payment (18 chars)
        default: `GD #${shortId}`, // Generic transaction (12 chars)
    };

    let description = templates[type] || templates.default;

    // Add custom prefix if provided
    if (options.prefix && options.prefix.length <= 5) {
        description = `${options.prefix} ${description}`;
    }

    // Validate length
    if (description.length > 25) {
        console.warn(
            `[PayOS] Description too long: ${description.length} chars, using default template`
        );
        description = templates.default;
    }

    // Log for debugging
    if (options.debug) {
        console.log(`[PayOS] Generated description: "${description}" (${description.length} chars)`);
    }

    return description;
};

/**
 * Generate full description for internal storage
 * @param {string} type - Transaction type
 * @param {Object} appointment - Appointment object
 * @returns {string} Full description for database
 */
export const generateFullDescription = (type, appointment) => {
    const serviceName = appointment.serviceType?.name || "Dịch vụ";
    const centerName = appointment.serviceCenter?.name || "Trung tâm";

    const templates = {
        service: `Thanh toán dịch vụ #${appointment._id} - ${serviceName} tại ${centerName}`,
        package: `Mua gói dịch vụ #${appointment._id} - ${serviceName}`,
        deposit: `Đặt cọc #${appointment._id} - ${serviceName} tại ${centerName}`,
        inspection: `Phí kiểm tra #${appointment._id} - ${serviceName} tại ${centerName}`,
        renewal: `Gia hạn #${appointment._id} - ${serviceName}`,
        upfront: `Tạm ứng #${appointment._id} - ${serviceName}`,
        default: `Thanh toán #${appointment._id}`,
    };

    return templates[type] || templates.default;
};

/**
 * Validate PayOS description
 * @param {string} description - Description to validate
 * @returns {Object} Validation result
 */
export const validatePayOSDescription = (description) => {
    const result = {
        isValid: true,
        length: description.length,
        warnings: [],
        errors: [],
    };

    // Check length
    if (description.length > 25) {
        result.isValid = false;
        result.errors.push(`Description exceeds 25 characters (${description.length})`);
    }

    // Check for Vietnamese characters with diacritics
    const vietnameseDiacritics = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    if (vietnameseDiacritics.test(description)) {
        result.warnings.push("Contains Vietnamese diacritics, PayOS will normalize");
    }

    // Check for special characters
    const specialChars = /[^a-zA-Z0-9\s#\-]/;
    if (specialChars.test(description)) {
        result.warnings.push("Contains special characters that may be removed by PayOS");
    }

    // Check if empty
    if (!description || description.trim().length === 0) {
        result.isValid = false;
        result.errors.push("Description cannot be empty");
    }

    return result;
};

/**
 * Extract short ID from full MongoDB ObjectId
 * @param {string|Object} id - MongoDB ObjectId
 * @param {number} length - Number of characters to extract (default: 5)
 * @returns {string} Short ID
 */
export const extractShortId = (id, length = 5) => {
    const idString = id.toString();
    return idString.slice(-length);
};

/**
 * Parse PayOS response description to extract transaction code
 * @param {string} payosDescription - Description from PayOS response
 * @returns {Object} Parsed description
 */
export const parsePayOSDescription = (payosDescription) => {
    // PayOS format: "TRANSACTIONCODE OriginalDescription"
    // Example: "CSR7SZLTLY4 TT dv 69109"

    const parts = payosDescription.split(' ');

    return {
        transactionCode: parts[0] || '',
        normalizedDescription: parts.slice(1).join(' ') || '',
        fullDescription: payosDescription,
    };
};

/**
 * Format amount for PayOS (must be integer)
 * @param {number} amount - Amount in VND
 * @returns {number} Rounded amount
 */
export const formatPayOSAmount = (amount) => {
    return Math.round(Number(amount));
};

/**
 * Generate payment items for PayOS
 * @param {Object} appointment - Appointment object
 * @param {number} amount - Total amount
 * @returns {Array} Payment items
 */
export const generatePaymentItems = (appointment, amount) => {
    return [
        {
            name: appointment.serviceType?.name || "Bảo dưỡng xe điện",
            quantity: 1,
            price: formatPayOSAmount(amount),
        },
    ];
};

/**
 * Check if PayOS credentials are configured
 * @returns {boolean} True if configured
 */
export const isPayOSConfigured = () => {
    return !!(
        process.env.PAYOS_CLIENT_ID &&
        process.env.PAYOS_API_KEY &&
        process.env.PAYOS_CHECKSUM_KEY
    );
};

/**
 * Log PayOS request for debugging
 * @param {Object} requestData - PayOS request data
 */
export const logPayOSRequest = (requestData) => {
    console.log('=== PayOS Request ===');
    console.log('Order Code:', requestData.orderCode);
    console.log('Amount:', formatPayOSAmount(requestData.amount), 'VND');
    console.log('Description:', `"${requestData.description}" (${requestData.description.length} chars)`);
    console.log('Return URL:', requestData.returnUrl);
    console.log('Cancel URL:', requestData.cancelUrl);
    console.log('Expires At:', new Date(requestData.expiredAt * 1000).toLocaleString('vi-VN'));
    console.log('====================');
};

/**
 * Log PayOS response for debugging
 * @param {Object} responseData - PayOS response data
 */
export const logPayOSResponse = (responseData) => {
    console.log('=== PayOS Response ===');
    console.log('Status:', responseData.code === '00' ? '✅ Success' : '❌ Failed');
    console.log('Order Code:', responseData.data?.orderCode);
    console.log('Payment Link ID:', responseData.data?.paymentLinkId);
    console.log('Status:', responseData.data?.status);
    console.log('Description (normalized):', responseData.data?.description);
    console.log('Checkout URL:', responseData.data?.checkoutUrl);
    console.log('=====================');
};

/**
 * Create PayOS error message based on error code
 * @param {string} errorCode - PayOS error code
 * @returns {string} User-friendly error message
 */
export const getPayOSErrorMessage = (errorCode) => {
    const errorMessages = {
        '01': 'Không tìm thấy thông tin merchant',
        '02': 'Checksum không hợp lệ',
        '03': 'Số tiền không hợp lệ',
        '04': 'Order code đã tồn tại',
        '20': 'Thông tin không đúng định dạng',
        '404': 'Không tìm thấy giao dịch',
        'default': 'Lỗi hệ thống thanh toán',
    };

    return errorMessages[errorCode] || errorMessages.default;
};

/**
 * Example usage in service
 */
export const exampleUsage = () => {
    console.log('=== PayOS Utils Example Usage ===');

    const appointmentId = '673a4b5c6d7e8f9012345670';

    // 1. Generate short description
    const shortDesc = generatePayOSDescription('service', appointmentId);
    console.log('Short Description:', shortDesc); // "TT dv #45670"

    // 2. Validate description
    const validation = validatePayOSDescription(shortDesc);
    console.log('Validation:', validation);

    // 3. Extract short ID
    const shortId = extractShortId(appointmentId);
    console.log('Short ID:', shortId); // "45670"

    // 4. Parse PayOS response
    const payosDesc = 'CSR7SZLTLY4 TT dv 69109';
    const parsed = parsePayOSDescription(payosDesc);
    console.log('Parsed:', parsed);

    // 5. Format amount
    const amount = formatPayOSAmount(499999.99);
    console.log('Formatted Amount:', amount); // 500000

    console.log('================================');
};

// Default export
export default {
    generatePayOSDescription,
    generateFullDescription,
    validatePayOSDescription,
    extractShortId,
    parsePayOSDescription,
    formatPayOSAmount,
    generatePaymentItems,
    isPayOSConfigured,
    logPayOSRequest,
    logPayOSResponse,
    getPayOSErrorMessage,
    exampleUsage,
};
