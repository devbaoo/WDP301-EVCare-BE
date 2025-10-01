import Vehicle from "../models/vehicle.js";
import Appointment from "../models/appointment.js";
import ServiceCenter from "../models/serviceCenter.js";
import ServiceType from "../models/serviceType.js";
import User from "../models/user.js";
import emailService from "./emailService.js";
import payosService from "./payosService.js";

// Lấy danh sách trung tâm dịch vụ có sẵn
const getAvailableServiceCenters = async (filters = {}) => {
  try {
    const { city, district, serviceTypeId, lat, lng, radius = 10 } = filters;

    let query = { status: "active" };

    if (city) query["address.city"] = new RegExp(city, "i");
    if (district) query["address.district"] = new RegExp(district, "i");
    if (serviceTypeId) query.services = serviceTypeId;

    // If coordinates provided, add location filter
    if (lat && lng) {
      query["address.coordinates.lat"] = {
        $gte: lat - radius / 111,
        $lte: lat + radius / 111,
      };
      query["address.coordinates.lng"] = {
        $gte: lng - radius / 111,
        $lte: lng + radius / 111,
      };
    }

    const serviceCenters = await ServiceCenter.find(query)
      .populate("services", "name category pricing.basePrice")
      .populate("staff.user", "username fullName email avatar")
      .sort({ "rating.average": -1 });

    return {
      success: true,
      statusCode: 200,
      message: "Lấy danh sách trung tâm dịch vụ thành công",
      data: serviceCenters,
    };
  } catch (error) {
    console.error("Get available service centers error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi lấy danh sách trung tâm dịch vụ",
    };
  }
};

// Lấy danh sách loại dịch vụ tương thích với xe
const getCompatibleServices = async (vehicleId, serviceCenterId = null) => {
  try {
    const vehicle = await Vehicle.findById(vehicleId).populate(
      "vehicleInfo.vehicleModel",
      "brand modelName batteryType batteryCapacity motorPower"
    );

    if (!vehicle) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy xe",
      };
    }

    let query = {
      status: "active",
      $or: [
        { "compatibleVehicles.brand": vehicle.vehicleInfo.vehicleModel.brand },
        {
          "compatibleVehicles.model":
            vehicle.vehicleInfo.vehicleModel.modelName,
        },
        { "compatibleVehicles.year": vehicle.vehicleInfo.year },
        {
          "compatibleVehicles.batteryType":
            vehicle.vehicleInfo.vehicleModel.batteryType,
        },
      ],
    };

    // If service center specified, filter by services offered
    if (serviceCenterId) {
      const serviceCenter = await ServiceCenter.findById(serviceCenterId);
      if (serviceCenter && serviceCenter.services.length > 0) {
        query._id = { $in: serviceCenter.services };
      }
    }

    const serviceTypes = await ServiceType.find(query).sort({
      "rating.average": -1,
      "aiData.successRate": -1,
    });

    return {
      success: true,
      statusCode: 200,
      message: "Lấy danh sách dịch vụ tương thích thành công",
      data: serviceTypes,
    };
  } catch (error) {
    console.error("Get compatible services error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi lấy danh sách dịch vụ tương thích",
    };
  }
};

// Lấy lịch trống của trung tâm và kỹ thuật viên (serviceTypeId có thể không bắt buộc)
const getAvailableSlots = async (serviceCenterId, serviceTypeId, date) => {
  try {
    const serviceCenter = await ServiceCenter.findById(serviceCenterId);
    const serviceType = serviceTypeId
      ? await ServiceType.findById(serviceTypeId)
      : null;

    if (!serviceCenter) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy trung tâm dịch vụ",
      };
    }

    // Cho phép không truyền serviceTypeId (ví dụ kiểm tra tổng quát trước)
    // Nếu không có serviceType, dùng thời lượng mặc định

    // Get technicians for this service center
    const technicians = serviceCenter.staff.filter(
      (staff) => staff.role === "technician" && staff.isActive
    );

    if (technicians.length === 0) {
      return {
        success: false,
        statusCode: 400,
        message: "Trung tâm không có kỹ thuật viên khả dụng",
      };
    }

    // Get existing appointments for the date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      serviceCenter: serviceCenterId,
      "appointmentTime.date": {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: { $in: ["confirmed", "in_progress"] },
    });

    // Generate available time slots
    const availableSlots = [];
    const defaultDuration = 60; // phút
    const serviceDuration =
      serviceType?.serviceDetails?.duration || defaultDuration; // minutes
    const workingHours = serviceCenter.operatingHours;

    // Validate date
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return {
        success: false,
        statusCode: 400,
        message: "Ngày không hợp lệ",
      };
    }

    // Validate center status
    if (serviceCenter.status && serviceCenter.status !== "active") {
      return {
        success: false,
        statusCode: 400,
        message: "Trung tâm đang tạm ngưng hoạt động",
      };
    }

    // Validate operating hours
    if (!workingHours || typeof workingHours !== "object") {
      return {
        success: false,
        statusCode: 400,
        message: "Trung tâm chưa cấu hình giờ làm việc",
      };
    }

    // Resolve day key across common formats
    const dayIndex = dateObj.getDay(); // 0=Sun ... 6=Sat
    const shortKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const longKeys = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const keyCandidates = [
      shortKeys[dayIndex],
      longKeys[dayIndex],
      shortKeys[dayIndex].toUpperCase(),
      longKeys[dayIndex].toUpperCase(),
      shortKeys[dayIndex].charAt(0).toUpperCase() +
      shortKeys[dayIndex].slice(1),
      longKeys[dayIndex].charAt(0).toUpperCase() + longKeys[dayIndex].slice(1),
    ];

    let todaySchedule = undefined;
    for (const k of keyCandidates) {
      if (
        workingHours &&
        Object.prototype.hasOwnProperty.call(workingHours, k)
      ) {
        todaySchedule = workingHours[k];
        break;
      }
    }

    if (!todaySchedule || !todaySchedule.isOpen) {
      return {
        success: false,
        statusCode: 400,
        message: "Trung tâm không hoạt động vào ngày này",
      };
    }

    // Generate time slots
    const startTime = todaySchedule.open;
    const endTime = todaySchedule.close;
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    for (
      let time = startMinutes;
      time + serviceDuration <= endMinutes;
      time += 30
    ) {
      const slotStart = new Date(date);
      slotStart.setHours(Math.floor(time / 60), time % 60, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);

      const timeString = `${Math.floor(time / 60)
        .toString()
        .padStart(2, "0")}:${(time % 60).toString().padStart(2, "0")}`;
      const endTimeString = `${Math.floor((time + serviceDuration) / 60)
        .toString()
        .padStart(2, "0")}:${((time + serviceDuration) % 60)
          .toString()
          .padStart(2, "0")}`;

      // Check if slot conflicts with existing appointments
      const hasConflict = existingAppointments.some((appointment) => {
        const apptStart = new Date(appointment.appointmentTime.date);
        const [apptHour, apptMin] = appointment.appointmentTime.startTime
          .split(":")
          .map(Number);
        apptStart.setHours(apptHour, apptMin, 0, 0);

        const apptEnd = new Date(apptStart);
        apptEnd.setMinutes(
          apptEnd.getMinutes() + appointment.appointmentTime.duration
        );

        return slotStart < apptEnd && slotEnd > apptStart;
      });

      if (!hasConflict) {
        availableSlots.push({
          startTime: timeString,
          endTime: endTimeString,
          duration: serviceDuration,
          availableTechnicians: technicians.map((t) => t.user),
        });
      }
    }

    return {
      success: true,
      statusCode: 200,
      message: "Lấy lịch trống thành công",
      data: {
        date,
        serviceCenter: serviceCenter.name,
        serviceType: serviceType?.name || "General Inspection",
        availableSlots,
        totalSlots: availableSlots.length,
      },
    };
  } catch (error) {
    console.error("Get available slots error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi lấy lịch trống",
    };
  }
};

// Tạo booking mới
const createBooking = async (bookingData) => {
  try {
    const {
      customerId,
      vehicleId,
      serviceCenterId,
      serviceTypeId,
      servicePackageId, // hỗ trợ gói dịch vụ
      appointmentDate,
      appointmentTime,
      serviceDescription,
      priority = "medium",
      // new options
      isInspectionOnly = false,
      paymentPreference, // 'online' | 'offline' | undefined
    } = bookingData;

    // Validate required fields
    const requiredFields = [
      "customerId",
      "vehicleId",
      "serviceCenterId",
      "appointmentDate",
      "appointmentTime",
    ];
    for (const field of requiredFields) {
      if (!bookingData[field]) {
        return {
          success: false,
          statusCode: 400,
          message: `Thiếu trường bắt buộc: ${field}`,
        };
      }
    }

    // Validate selection: must choose either (serviceType or servicePackage) unless inspection-only
    if (!isInspectionOnly && !serviceTypeId && !servicePackageId) {
      return {
        success: false,
        statusCode: 400,
        message:
          "Vui lòng chọn loại dịch vụ hoặc gói dịch vụ, hoặc bật tùy chọn kiểm tra trước",
      };
    }

    // Verify vehicle belongs to customer
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      owner: customerId,
    }).populate("vehicleInfo.vehicleModel", "brand modelName");

    if (!vehicle) {
      return {
        success: false,
        statusCode: 400,
        message: "Xe không thuộc về khách hàng này",
      };
    }

    // Get service type details if provided and not inspection-only
    let serviceType = null;
    if (serviceTypeId) {
      serviceType = await ServiceType.findById(serviceTypeId);
      if (!serviceType) {
        return {
          success: false,
          statusCode: 404,
          message: "Không tìm thấy loại dịch vụ",
        };
      }
    }

    // Check if using service package
    let servicePackage = null;
    let isFromPackage = false;
    // estimated cost logic
    let estimatedCost = 0;
    if (isInspectionOnly) {
      // miễn phí ước tính, trung tâm sẽ báo giá sau
      estimatedCost = 0;
    } else if (serviceType) {
      estimatedCost = serviceType.pricing?.basePrice || 0;
    }

    if (servicePackageId) {
      const CustomerPackage = (await import("../models/customerPackage.js"))
        .default;
      const ServicePackage = (await import("../models/servicePackage.js"))
        .default;

      // Try to interpret provided id as existing CustomerPackage first
      servicePackage = await CustomerPackage.findOne({
        _id: servicePackageId,
        customerId,
        vehicleId,
      }).populate("packageId");

      let packageCatalog = null;
      if (!servicePackage) {
        // Not an existing customer package, treat as catalog ServicePackage id chosen at booking
        packageCatalog = await ServicePackage.findById(servicePackageId);
        if (!packageCatalog || !packageCatalog.isActive) {
          return {
            success: false,
            statusCode: 400,
            message: "Gói dịch vụ không hợp lệ hoặc đã ngừng bán",
          };
        }

        // Create a new customer package for this booking context
        const now = new Date();
        const end = new Date(now);
        end.setMonth(end.getMonth() + (packageCatalog.durationMonths || 1));

        const totalQuota =
          (packageCatalog.maxServicesPerMonth || 1) *
          (packageCatalog.durationMonths || 1);

        servicePackage = await CustomerPackage.create({
          customerId,
          vehicleId,
          packageId: packageCatalog._id,
          startDate: now,
          endDate: end,
          remainingServices: totalQuota,
          totalUsed: 0,
          status: "active",
          paymentStatus: "pending",
          autoRenewal: false,
        });

        // Populate for later checks
        servicePackage = await CustomerPackage.findById(
          servicePackage._id
        ).populate("packageId");
      }

      // At this point, servicePackage is a CustomerPackage doc with populated packageId
      if (!servicePackage || servicePackage.status !== "active") {
        return {
          success: false,
          statusCode: 400,
          message: "Gói dịch vụ của khách hàng không khả dụng",
        };
      }

      if (servicePackage.remainingServices <= 0) {
        return {
          success: false,
          statusCode: 400,
          message: "Gói dịch vụ đã hết lượt sử dụng",
        };
      }

      isFromPackage = true;

      // If user also selected a concrete service, validate it is in package
      if (serviceTypeId) {
        const isServiceIncluded = (
          servicePackage.packageId?.includedServices || []
        )
          .map((id) => id.toString())
          .includes(serviceTypeId.toString());
        if (!isServiceIncluded) {
          return {
            success: false,
            statusCode: 400,
            message: "Loại dịch vụ này không có trong gói đã chọn",
          };
        }
      }

      // Using package so customer won't be charged additionally at booking time
      estimatedCost = 0;
    }

    // Calculate end time
    const duration = serviceType?.serviceDetails?.duration || 60; // default 60' for inspection or when unspecified
    const [startHour, startMin] = appointmentTime.split(":").map(Number);
    const endMinutes = startHour * 60 + startMin + duration;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, "0")}:${endMin
      .toString()
      .padStart(2, "0")}`;

    // Create appointment
    const appointment = new Appointment({
      customer: customerId,
      vehicle: vehicleId,
      serviceCenter: serviceCenterId,
      serviceType: serviceTypeId || undefined,
      appointmentTime: {
        date: new Date(appointmentDate),
        startTime: appointmentTime,
        endTime: endTime,
        duration: duration,
      },
      serviceDetails: {
        description: serviceDescription,
        priority: priority,
        estimatedCost: estimatedCost,
        isFromPackage: isFromPackage,
        servicePackageId: servicePackageId,
        isInspectionOnly: Boolean(isInspectionOnly),
      },
      status: "pending_confirmation",
    });

    await appointment.save();

    // Update package usage if using package
    if (isFromPackage && servicePackage) {
      servicePackage.remainingServices = Math.max(
        0,
        (servicePackage.remainingServices || 0) - 1
      );
      servicePackage.totalUsed = (servicePackage.totalUsed || 0) + 1;
      servicePackage.lastUsedAt = new Date();
      servicePackage.usageHistory = servicePackage.usageHistory || [];
      servicePackage.usageHistory.push({
        appointmentId: appointment._id,
        serviceTypeId: serviceTypeId || undefined,
        notes: serviceTypeId
          ? `Sử dụng gói cho dịch vụ ${serviceType?.name || ""}`
          : "Sử dụng gói khi kiểm tra tổng quát",
      });
      await servicePackage.save();
    }

    // Calculate upfront charge per policy: deposit or inspection fee
    const DEPOSIT_RATE = Number(process.env.DEPOSIT_RATE || 0); // e.g., 0.2 for 20%
    const INSPECTION_FEE = Number(process.env.INSPECTION_FEE || 0); // VND

    const requiresPayment = appointment.serviceDetails.estimatedCost > 0;
    let upfrontCharge = 0;
    let paymentDescription = "";

    if (appointment.serviceDetails.isInspectionOnly) {
      upfrontCharge = Math.max(0, Math.round(INSPECTION_FEE));
      paymentDescription = "Phí kiểm tra tổng quát";
    } else if (requiresPayment && DEPOSIT_RATE > 0) {
      upfrontCharge = Math.max(
        0,
        Math.round(appointment.serviceDetails.estimatedCost * DEPOSIT_RATE)
      );
      paymentDescription = `Đặt cọc ${Math.round(
        DEPOSIT_RATE * 100
      )}% cho dịch vụ`;
    }

    // Set appointment payment placeholder (for booking step only)
    if (upfrontCharge > 0) {
      if (paymentPreference === "online") {
        appointment.payment.method = "ewallet";
      } else if (paymentPreference === "offline") {
        appointment.payment.method = "cash";
      } else {
        appointment.payment.method = "cash";
      }
      appointment.payment.status = "pending";
      appointment.payment.amount = upfrontCharge;
    } else {
      appointment.payment.method = "not_required";
      appointment.payment.status = "pending";
      appointment.payment.amount = 0;
    }
    await appointment.save();

    // Populate appointment data for response and email (after payment fields are set)
    await appointment.populate([
      { path: "customer", select: "username fullName email phone" },
      {
        path: "vehicle",
        select: "vehicleInfo technicalSpecs",
        populate: {
          path: "vehicleInfo.vehicleModel",
          select: "brand modelName batteryType",
        },
      },
      { path: "serviceCenter", select: "name address contact" },
      { path: "serviceType", select: "name category pricing" },
    ]);

    // Send confirmation email (now includes correct payment method/status)
    try {
      await emailService.sendBookingConfirmation(appointment);
    } catch (emailError) {
      console.error("Send booking confirmation email error:", emailError);
      // Don't fail the booking if email fails
    }

    let paymentInfo = null;

    // If there is an upfront charge and online preference, create a payment link for deposit/inspection fee
    if (upfrontCharge > 0 && paymentPreference === "online") {
      try {
        const paymentResult = await payosService.createAppointmentCustomPayment(
          appointment._id,
          customerId,
          upfrontCharge,
          paymentDescription
        );
        if (paymentResult.success) {
          paymentInfo = paymentResult.data;
        }
      } catch (paymentError) {
        console.error("Create upfront payment error:", paymentError);
        // Don't fail the booking if payment creation fails
      }
    }

    return {
      success: true,
      statusCode: 201,
      message:
        upfrontCharge > 0
          ? "Tạo booking thành công. Vui lòng thanh toán đặt cọc/phí kiểm tra để xác nhận."
          : "Tạo booking thành công. Vui lòng chờ xác nhận từ trung tâm.",
      data: {
        appointment,
        payment: paymentInfo,
        requiresPayment: upfrontCharge > 0,
      },
    };
  } catch (error) {
    console.error("Create booking error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi tạo booking",
    };
  }
};

// Lấy danh sách booking của customer
const getCustomerBookings = async (customerId, filters = {}) => {
  try {
    const {
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    let query = { customer: customerId };
    if (status) query.status = status;

    // Filter by date range
    if (startDate || endDate) {
      query["appointmentTime.date"] = {};
      if (startDate) query["appointmentTime.date"].$gte = new Date(startDate);
      if (endDate) {
        const to = new Date(endDate);
        to.setHours(23, 59, 59, 999);
        query["appointmentTime.date"].$lte = to;
      }
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const appointments = await Appointment.find(query)
      .populate([
        { path: "vehicle", select: "vehicleInfo" },
        { path: "serviceCenter", select: "name address contact" },
        { path: "serviceType", select: "name category pricing" },
        { path: "technician", select: "username fullName" },
      ])
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    return {
      success: true,
      statusCode: 200,
      message: "Lấy danh sách booking thành công",
      data: {
        appointments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    };
  } catch (error) {
    console.error("Get customer bookings error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi lấy danh sách booking",
    };
  }
};

// Hủy booking
const cancelBooking = async (bookingId, customerId, reason) => {
  try {
    const appointment = await Appointment.findOne({
      _id: bookingId,
      customer: customerId,
    });

    if (!appointment) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy booking",
      };
    }

    if (appointment.status === "completed") {
      return {
        success: false,
        statusCode: 400,
        message: "Không thể hủy booking đã hoàn thành",
      };
    }

    await appointment.cancel(customerId, reason);

    return {
      success: true,
      statusCode: 200,
      message: "Hủy booking thành công",
    };
  } catch (error) {
    console.error("Cancel booking error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi hủy booking",
    };
  }
};

// Dời lịch booking
const rescheduleBooking = async (bookingId, customerId, rescheduleData) => {
  try {
    const { newDate, newTime } = rescheduleData;

    // Validate required fields
    if (!newDate || !newTime) {
      return {
        success: false,
        statusCode: 400,
        message: "Thiếu thông tin ngày và giờ mới",
      };
    }

    // Find the appointment
    const appointment = await Appointment.findOne({
      _id: bookingId,
      customer: customerId,
    }).populate("serviceType", "serviceDetails");

    if (!appointment) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy booking hoặc bạn không có quyền dời lịch",
      };
    }

    // Check if appointment can be rescheduled
    if (!["pending_confirmation", "confirmed"].includes(appointment.status)) {
      return {
        success: false,
        statusCode: 400,
        message:
          "Chỉ có thể dời lịch khi booking đang chờ xác nhận hoặc đã xác nhận",
      };
    }

    // Check if new date is in the future
    const newAppointmentDate = new Date(newDate);
    const now = new Date();
    if (newAppointmentDate <= now) {
      return {
        success: false,
        statusCode: 400,
        message: "Ngày hẹn mới phải trong tương lai",
      };
    }

    // Calculate new end time
    const duration = appointment.serviceType.serviceDetails.duration;
    const [startHour, startMin] = newTime.split(":").map(Number);
    const endMinutes = startHour * 60 + startMin + duration;
    const endHour = Math.floor(endMinutes / 60);
    const endMin = endMinutes % 60;
    const endTime = `${endHour.toString().padStart(2, "0")}:${endMin
      .toString()
      .padStart(2, "0")}`;

    // Update appointment
    appointment.appointmentTime = {
      date: newAppointmentDate,
      startTime: newTime,
      endTime: endTime,
      duration: duration,
    };
    appointment.status = "pending_confirmation"; // Reset to pending confirmation
    appointment.rescheduleHistory = appointment.rescheduleHistory || [];
    appointment.rescheduleHistory.push({
      oldDate: appointment.appointmentTime.date,
      oldTime: appointment.appointmentTime.startTime,
      newDate: newAppointmentDate,
      newTime: newTime,
      rescheduledAt: new Date(),
      rescheduledBy: customerId,
    });

    await appointment.save();

    // Populate for response
    await appointment.populate([
      { path: "customer", select: "username fullName email phone" },
      { path: "vehicle", select: "vehicleInfo" },
      { path: "serviceCenter", select: "name address contact" },
      { path: "serviceType", select: "name category pricing" },
    ]);

    // Send reschedule confirmation email
    try {
      await emailService.sendRescheduleConfirmation(appointment);
    } catch (emailError) {
      console.error("Send reschedule confirmation email error:", emailError);
      // Don't fail the reschedule if email fails
    }

    return {
      success: true,
      statusCode: 200,
      message: "Dời lịch thành công. Vui lòng chờ xác nhận từ trung tâm.",
      data: appointment,
    };
  } catch (error) {
    console.error("Reschedule booking error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi dời lịch booking",
    };
  }
};

// Lấy chi tiết booking
const getBookingDetails = async (bookingId, customerId) => {
  try {
    const appointment = await Appointment.findOne({
      _id: bookingId,
      customer: customerId,
    })
      .populate({ path: "customer", select: "username fullName email phone" })
      .populate({
        path: "vehicle",
        select: "vehicleInfo",
        populate: {
          path: "vehicleInfo.vehicleModel",
          select: "brand modelName batteryType",
        },
      })
      .populate({
        path: "serviceCenter",
        select: "name address contact operatingHours",
      })
      .populate({
        path: "serviceType",
        select: "name category pricing serviceDetails",
      })
      .populate({ path: "technician", select: "fullName email phone" });

    if (!appointment) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy booking",
      };
    }

    return {
      success: true,
      statusCode: 200,
      message: "Lấy chi tiết booking thành công",
      data: appointment,
    };
  } catch (error) {
    console.error("Get booking details error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi lấy chi tiết booking",
    };
  }
};

// Danh sách booking đã thanh toán và đang chờ admin/staff xác nhận
const getPaidAwaitingConfirmation = async (filters = {}) => {
  try {
    const {
      serviceCenterId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    // Awaiting confirmation logic:
    // - Payment is PAID
    // - Not yet confirmed by admin/manager (confirmation.isConfirmed = false)
    // - Status may be either pending_confirmation or already set to confirmed by payment flow
    const query = {
      "payment.status": "paid",
      $or: [{ status: "pending_confirmation" }, { status: "confirmed" }],
      $orAdditional: [],
    };

    // Enforce not confirmed flag (support missing confirmation object)
    // We cannot use two $or at the same level directly, so merge after building
    const notConfirmedOrMissing = [
      { "confirmation.isConfirmed": { $ne: true } },
      { confirmation: { $exists: false } },
    ];

    if (serviceCenterId) query.serviceCenter = serviceCenterId;

    if (dateFrom || dateTo) {
      query["appointmentTime.date"] = {};
      if (dateFrom) query["appointmentTime.date"].$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        query["appointmentTime.date"].$lte = to;
      }
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Merge second OR into query
    const finalQuery = { ...query };
    delete finalQuery.$orAdditional;
    finalQuery.$and = [{ $or: query.$or }, { $or: notConfirmedOrMissing }];

    const appointments = await Appointment.find(finalQuery)
      .populate([
        { path: "customer", select: "fullName phone email" },
        {
          path: "vehicle",
          select: "vehicleInfo",
          populate: {
            path: "vehicleInfo.vehicleModel",
            select: "brand modelName",
          },
        },
        { path: "serviceCenter", select: "name address" },
        { path: "serviceType", select: "name pricing" },
      ])
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(finalQuery);

    return {
      success: true,
      statusCode: 200,
      message: "Lấy danh sách booking đã thanh toán - chờ xác nhận thành công",
      data: {
        appointments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    };
  } catch (error) {
    console.error("Get paid awaiting confirmation error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi lấy danh sách booking chờ xác nhận",
    };
  }
};

// Danh sách booking thanh toán offline đang chờ staff xác nhận
const getPendingOfflinePaymentBookings = async (filters = {}) => {
  try {
    const {
      serviceCenterId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    // Logic: lấy các booking có payment method = "cash" và status = "pending" và chưa bị auto-cancel
    const query = {
      "payment.method": "cash",
      "payment.status": "pending",
      status: { $in: ["pending_confirmation", "pending"] },
      // Chưa được staff confirm
      $or: [
        { "confirmation.isConfirmed": { $ne: true } },
        { confirmation: { $exists: false } },
      ],
    };

    if (serviceCenterId) query.serviceCenter = serviceCenterId;

    if (dateFrom || dateTo) {
      query["appointmentTime.date"] = {};
      if (dateFrom) query["appointmentTime.date"].$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        query["appointmentTime.date"].$lte = to;
      }
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const appointments = await Appointment.find(query)
      .populate([
        { path: "customer", select: "fullName phone email" },
        {
          path: "vehicle",
          select: "vehicleInfo",
          populate: {
            path: "vehicleInfo.vehicleModel",
            select: "brand modelName",
          },
        },
        { path: "serviceCenter", select: "name address" },
        { path: "serviceType", select: "name pricing" },
      ])
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    return {
      success: true,
      statusCode: 200,
      message: "Lấy danh sách booking thanh toán offline - chờ xác nhận thành công",
      data: {
        appointments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    };
  } catch (error) {
    console.error("Get pending offline payment bookings error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi lấy danh sách booking thanh toán offline chờ xác nhận",
    };
  }
};

// Danh sách booking đã được confirm (đã xác nhận) để đẩy vào work-progress
const getConfirmedBookings = async (filters = {}) => {
  try {
    const {
      serviceCenterId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const query = {
      status: "confirmed",
      $or: [
        { "confirmation.isConfirmed": true },
        { "confirmation.confirmedAt": { $exists: true } },
      ],
    };

    if (serviceCenterId) query.serviceCenter = serviceCenterId;

    if (dateFrom || dateTo) {
      query["appointmentTime.date"] = {};
      if (dateFrom) query["appointmentTime.date"].$gte = new Date(dateFrom);
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        query["appointmentTime.date"].$lte = to;
      }
    }

    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const appointments = await Appointment.find(query)
      .populate([
        { path: "customer", select: "fullName phone email" },
        {
          path: "vehicle",
          select: "vehicleInfo",
          populate: {
            path: "vehicleInfo.vehicleModel",
            select: "brand modelName",
          },
        },
        { path: "serviceCenter", select: "name address" },
        { path: "serviceType", select: "name pricing" },
      ])
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    return {
      success: true,
      statusCode: 200,
      message: "Lấy danh sách booking đã xác nhận thành công",
      data: {
        appointments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    };
  } catch (error) {
    console.error("Get confirmed bookings error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi lấy danh sách booking đã xác nhận",
    };
  }
};

const confirmBooking = async (bookingId, staffId) => {
  try {
    const appointment = await Appointment.findById(bookingId).populate(
      "serviceCenter"
    );
    if (!appointment) {
      return {
        success: false,
        statusCode: 404,
        message: "Không tìm thấy booking",
      };
    }

    // Kiểm tra yêu cầu thanh toán upfront (deposit/inspection fee)
    const requiresUpfront = (appointment?.payment?.amount || 0) > 0;
    const isOfflinePayment = appointment?.payment?.method === "cash";

    // Với upfront payment (deposit/inspection fee): phải thanh toán trước khi confirm
    // Với offline payment: chỉ cần xác nhận lịch hẹn, thanh toán chính sẽ ở cuối workflow
    if (requiresUpfront && !isOfflinePayment && appointment.payment.status !== "paid") {
      return {
        success: false,
        statusCode: 400,
        message: "Chưa thanh toán phí đặt cọc/kiểm tra online",
      };
    }

    // Capacity check (đơn giản): chặn nếu center có status !== 'active'
    if (
      appointment?.serviceCenter?.status &&
      appointment.serviceCenter.status !== "active"
    ) {
      return {
        success: false,
        statusCode: 400,
        message: "Trung tâm đang tạm ngưng hoạt động",
      };
    }

    try {
      appointment.statusHistory = appointment.statusHistory || [];
      appointment.statusHistory.push({
        from: appointment.status,
        to: "confirmed",
        by: staffId,
        at: new Date(),
      });
    } catch (_) { }

    appointment.status = "confirmed";
    appointment.confirmation = appointment.confirmation || {};
    appointment.confirmation.isConfirmed = true;
    appointment.confirmation.confirmedAt = new Date();
    appointment.confirmation.confirmedBy = staffId;

    // NOTE: KHÔNG cập nhật payment status ở đây
    // Staff confirm chỉ là xác nhận lịch hẹn, thanh toán chính sẽ ở cuối workflow

    await appointment.save();

    return {
      success: true,
      statusCode: 200,
      message: "Xác nhận lịch hẹn thành công",
      data: appointment,
    };
  } catch (error) {
    console.error("Confirm booking error:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Lỗi khi xác nhận booking",
    };
  }
};

export default {
  getAvailableServiceCenters,
  getCompatibleServices,
  getAvailableSlots,
  createBooking,
  confirmBooking,
  getCustomerBookings,
  cancelBooking,
  rescheduleBooking,
  getBookingDetails,
  getPaidAwaitingConfirmation,
  getPendingOfflinePaymentBookings,
  getConfirmedBookings,
};
