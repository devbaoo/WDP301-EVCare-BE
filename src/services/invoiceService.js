import { v4 as uuidv4 } from "uuid";
import emailService from "./emailService.js";
import Appointment from "../models/appointment.js";

// CJS interop: invoice.js exports via module.exports
const loadInvoiceModel = async () => {
  const mod = await import("../models/invoice.js");
  return mod.default || mod;
};

const generateInvoiceNumber = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `INV-${y}${m}${d}-${uuidv4().slice(0, 8).toUpperCase()}`;
};

// Tạo invoice từ appointment (đơn giản): nhận items từ body nếu có
// items: [{ description, quantity, unitPrice }]
const createFromAppointment = async (appointmentId, payload = {}) => {
  try {
    const Invoice = await loadInvoiceModel();
    const appointment = await Appointment.findById(appointmentId)
      .populate("customer", "_id")
      .populate("serviceType", "pricing name");

    if (!appointment) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy booking",
      };
    }

    const items = Array.isArray(payload.items) ? payload.items : [];
    let subtotal = 0;
    // Ưu tiên lấy theo quote đã duyệt, sau đó basePrice của serviceType, cuối cùng là estimatedCost
    const quoteApproved =
      appointment?.inspectionAndQuote?.quoteStatus === "approved";
    const quoteAmount = Number(
      appointment?.inspectionAndQuote?.quoteAmount || 0
    );
    const basePrice = Number(appointment?.serviceType?.pricing?.basePrice || 0);
    const estimatedCost = Number(
      appointment?.serviceDetails?.estimatedCost || 0
    );

    if (items.length > 0) {
      for (const it of items) {
        const qty = Number(it.quantity || 0);
        const price = Number(it.unitPrice || 0);
        subtotal += qty * price;
      }
    } else if (quoteApproved && quoteAmount > 0) {
      subtotal = quoteAmount;
    } else if (basePrice > 0) {
      subtotal = basePrice;
    } else {
      subtotal = estimatedCost;
    }

    // Không tính thuế/discount theo yêu cầu
    const taxAmount = 0;
    const discountAmount = 0;
    const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);

    const invoiceNumber = generateInvoiceNumber();
    const issueDate = new Date();
    const dueDate = new Date(issueDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    const doc = await Invoice.create({
      customerId: appointment.customer._id,
      serviceRecordId: undefined,
      invoiceNumber,
      issueDate,
      dueDate,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      status: "draft",
      paymentTerms: payload.paymentTerms || "Due in 7 days",
      notes:
        payload.notes ||
        `appointmentId=${appointment._id}; source=${
          quoteApproved && quoteAmount > 0
            ? "quote"
            : basePrice > 0
            ? "serviceType"
            : "estimatedCost"
        }`,
    });

    return {
      success: true,
      statusCode: 201,
      message: "Tạo hóa đơn nháp thành công",
      data: doc,
    };
  } catch (error) {
    console.error("Create invoice error:", error);
    return { success: false, statusCode: 500, message: "Lỗi khi tạo hóa đơn" };
  }
};

const sendInvoiceEmail = async (invoiceId) => {
  try {
    const Invoice = await loadInvoiceModel();
    const invoice = await Invoice.findById(invoiceId).populate(
      "customerId",
      "fullName username email"
    );
    if (!invoice)
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy hóa đơn",
      };

    // Thử lấy appointmentId từ notes nếu có dạng 'appointmentId=...'
    let appointment = null;
    try {
      const match = String(invoice.notes || "").match(
        /appointmentId=([a-f\d]{24})/i
      );
      if (match && match[1]) {
        appointment = await Appointment.findById(match[1])
          .populate("serviceType", "name pricing")
          .lean();
      }
    } catch (_) {}

    // Gửi email HTML (không PDF) kèm dữ liệu appointment nếu có để hiển thị breakdown
    await emailService.sendSimpleInvoiceEmail({ invoice, appointment });

    // cập nhật trạng thái đã gửi
    invoice.status = invoice.status === "draft" ? "sent" : invoice.status;
    await invoice.save();

    return {
      success: true,
      statusCode: 200,
      message: "Gửi email hóa đơn thành công",
    };
  } catch (error) {
    console.error("Send invoice email error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi gửi email hóa đơn",
    };
  }
};

export default { createFromAppointment, sendInvoiceEmail };
