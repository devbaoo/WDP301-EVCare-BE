import Appointment from "../models/appointment.js";
import Payment from "../models/payment.js";
import User from "../models/user.js";
import Vehicle from "../models/vehicle.js";
import ServiceCenter from "../models/serviceCenter.js";
import ServicePackage from "../models/servicePackage.js";
import CustomerPackage from "../models/customerPackage.js";
import Invoice from "../models/invoice.js";
import Part from "../models/part.js";
import CenterInventory from "../models/centerInventory.js";
import mongoose from "mongoose";

/**
 * Tính toán thống kê tổng quan cho dashboard
 */
const getOverviewStats = async (filters = {}) => {
  try {
    const { startDate, endDate, serviceCenterId } = filters;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Build service center filter
    const centerFilter = serviceCenterId
      ? { serviceCenter: serviceCenterId }
      : {};

    // 1. Tổng doanh thu từ payments đã thanh toán
    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: "paid",
          ...dateFilter,
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$paymentInfo.amount" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    const revenue = revenueData[0] || { totalRevenue: 0, totalTransactions: 0 };

    // 2. Tổng số bookings
    const bookingFilter = { ...dateFilter, ...centerFilter };
    const totalBookings = await Appointment.countDocuments(bookingFilter);

    // Bookings theo trạng thái
    const bookingsByStatus = await Appointment.aggregate([
      { $match: bookingFilter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // 3. Tổng số khách hàng
    const totalCustomers = await User.countDocuments({ role: "customer" });

    // Khách hàng mới trong khoảng thời gian
    const newCustomers = await User.countDocuments({
      role: "customer",
      ...dateFilter,
    });

    // 4. Tổng số xe
    const totalVehicles = await Vehicle.countDocuments();

    // 5. Tổng số service centers
    const totalServiceCenters = await ServiceCenter.countDocuments();

    // 6. Tổng số gói dịch vụ đang hoạt động
    const activePackages = await CustomerPackage.countDocuments({
      status: "active",
    });

    // 7. Top dịch vụ được sử dụng nhiều nhất
    const topServices = await Appointment.aggregate([
      { $match: { serviceType: { $ne: null }, ...bookingFilter } },
      {
        $group: {
          _id: "$serviceType",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "servicetypes",
          localField: "_id",
          foreignField: "_id",
          as: "serviceInfo",
        },
      },
      { $unwind: "$serviceInfo" },
      {
        $project: {
          _id: 1,
          name: "$serviceInfo.name",
          count: 1,
        },
      },
    ]);

    // 8. Technician performance
    const technicianStats = await Appointment.aggregate([
      {
        $match: {
          technician: { $ne: null },
          status: "completed",
          ...bookingFilter,
        },
      },
      {
        $group: {
          _id: "$technician",
          totalJobs: { $sum: 1 },
        },
      },
      { $sort: { totalJobs: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "techInfo",
        },
      },
      { $unwind: "$techInfo" },
      {
        $project: {
          _id: 1,
          name: "$techInfo.fullName",
          email: "$techInfo.email",
          totalJobs: 1,
        },
      },
    ]);

    return {
      success: true,
      data: {
        revenue: {
          total: revenue.totalRevenue,
          transactions: revenue.totalTransactions,
          average:
            revenue.totalTransactions > 0
              ? revenue.totalRevenue / revenue.totalTransactions
              : 0,
        },
        bookings: {
          total: totalBookings,
          byStatus: bookingsByStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {}),
        },
        customers: {
          total: totalCustomers,
          new: newCustomers,
        },
        vehicles: {
          total: totalVehicles,
        },
        serviceCenters: {
          total: totalServiceCenters,
        },
        activePackages,
        topServices,
        topTechnicians: technicianStats,
      },
    };
  } catch (error) {
    console.error("Error getting overview stats:", error);
    return {
      success: false,
      message: "Failed to get overview statistics",
      error: error.message,
    };
  }
};

/**
 * Thống kê doanh thu theo thời gian (ngày, tháng, năm)
 */
const getRevenueAnalytics = async (filters = {}) => {
  try {
    const { startDate, endDate, groupBy = "day", serviceCenterId } = filters;

    // Build date filter
    const dateFilter = {
      status: "paid",
    };

    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Group format based on groupBy parameter
    let groupFormat;
    switch (groupBy) {
      case "month":
        groupFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
        break;
      case "year":
        groupFormat = {
          year: { $year: "$createdAt" },
        };
        break;
      case "day":
      default:
        groupFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
        break;
    }

    const revenueByTime = await Payment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupFormat,
          totalRevenue: { $sum: "$paymentInfo.amount" },
          totalTransactions: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Format response
    const formattedData = revenueByTime.map((item) => {
      let period;
      if (groupBy === "year") {
        period = `${item._id.year}`;
      } else if (groupBy === "month") {
        period = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
      } else {
        period = `${item._id.year}-${String(item._id.month).padStart(
          2,
          "0"
        )}-${String(item._id.day).padStart(2, "0")}`;
      }

      return {
        period,
        revenue: item.totalRevenue,
        transactions: item.totalTransactions,
        average: item.totalRevenue / item.totalTransactions,
      };
    });

    // Calculate growth rate
    const growthRate =
      formattedData.length >= 2
        ? ((formattedData[formattedData.length - 1].revenue -
            formattedData[formattedData.length - 2].revenue) /
            formattedData[formattedData.length - 2].revenue) *
          100
        : 0;

    return {
      success: true,
      data: {
        analytics: formattedData,
        summary: {
          totalRevenue: formattedData.reduce(
            (sum, item) => sum + item.revenue,
            0
          ),
          totalTransactions: formattedData.reduce(
            (sum, item) => sum + item.transactions,
            0
          ),
          growthRate: growthRate.toFixed(2),
        },
      },
    };
  } catch (error) {
    console.error("Error getting revenue analytics:", error);
    return {
      success: false,
      message: "Failed to get revenue analytics",
      error: error.message,
    };
  }
};

/**
 * Thống kê booking theo thời gian
 */
const getBookingAnalytics = async (filters = {}) => {
  try {
    const { startDate, endDate, groupBy = "day", serviceCenterId } = filters;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter["appointmentTime.date"] = {};
      if (startDate)
        dateFilter["appointmentTime.date"].$gte = new Date(startDate);
      if (endDate) dateFilter["appointmentTime.date"].$lte = new Date(endDate);
    }

    const centerFilter = serviceCenterId
      ? { serviceCenter: serviceCenterId }
      : {};

    let groupFormat;
    switch (groupBy) {
      case "month":
        groupFormat = {
          year: { $year: "$appointmentTime.date" },
          month: { $month: "$appointmentTime.date" },
        };
        break;
      case "year":
        groupFormat = {
          year: { $year: "$appointmentTime.date" },
        };
        break;
      case "day":
      default:
        groupFormat = {
          year: { $year: "$appointmentTime.date" },
          month: { $month: "$appointmentTime.date" },
          day: { $dayOfMonth: "$appointmentTime.date" },
        };
        break;
    }

    const bookingStats = await Appointment.aggregate([
      { $match: { ...dateFilter, ...centerFilter } },
      {
        $group: {
          _id: groupFormat,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelled: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$status", "pending_confirmation"] }, 1, 0],
            },
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const formattedData = bookingStats.map((item) => {
      let period;
      if (groupBy === "year") {
        period = `${item._id.year}`;
      } else if (groupBy === "month") {
        period = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
      } else {
        period = `${item._id.year}-${String(item._id.month).padStart(
          2,
          "0"
        )}-${String(item._id.day).padStart(2, "0")}`;
      }

      return {
        period,
        total: item.total,
        completed: item.completed,
        cancelled: item.cancelled,
        pending: item.pending,
        inProgress: item.inProgress,
        completionRate: ((item.completed / item.total) * 100).toFixed(2),
      };
    });

    return {
      success: true,
      data: {
        analytics: formattedData,
        summary: {
          totalBookings: formattedData.reduce(
            (sum, item) => sum + item.total,
            0
          ),
          totalCompleted: formattedData.reduce(
            (sum, item) => sum + item.completed,
            0
          ),
          totalCancelled: formattedData.reduce(
            (sum, item) => sum + item.cancelled,
            0
          ),
          averageCompletionRate:
            formattedData.reduce(
              (sum, item) => sum + parseFloat(item.completionRate),
              0
            ) / formattedData.length || 0,
        },
      },
    };
  } catch (error) {
    console.error("Error getting booking analytics:", error);
    return {
      success: false,
      message: "Failed to get booking analytics",
      error: error.message,
    };
  }
};

/**
 * Thống kê customer growth
 */
const getCustomerGrowth = async (filters = {}) => {
  try {
    const { startDate, endDate, groupBy = "month" } = filters;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    let groupFormat;
    switch (groupBy) {
      case "year":
        groupFormat = {
          year: { $year: "$createdAt" },
        };
        break;
      case "day":
        groupFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
          day: { $dayOfMonth: "$createdAt" },
        };
        break;
      case "month":
      default:
        groupFormat = {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" },
        };
        break;
    }

    const customerGrowth = await User.aggregate([
      { $match: { role: "customer", ...dateFilter } },
      {
        $group: {
          _id: groupFormat,
          newCustomers: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const formattedData = customerGrowth.map((item) => {
      let period;
      if (groupBy === "year") {
        period = `${item._id.year}`;
      } else if (groupBy === "day") {
        period = `${item._id.year}-${String(item._id.month).padStart(
          2,
          "0"
        )}-${String(item._id.day).padStart(2, "0")}`;
      } else {
        period = `${item._id.year}-${String(item._id.month).padStart(2, "0")}`;
      }

      return {
        period,
        newCustomers: item.newCustomers,
      };
    });

    return {
      success: true,
      data: {
        growth: formattedData,
        summary: {
          totalNewCustomers: formattedData.reduce(
            (sum, item) => sum + item.newCustomers,
            0
          ),
        },
      },
    };
  } catch (error) {
    console.error("Error getting customer growth:", error);
    return {
      success: false,
      message: "Failed to get customer growth",
      error: error.message,
    };
  }
};

/**
 * Thống kê service center performance
 */
const getServiceCenterPerformance = async (filters = {}) => {
  try {
    const { startDate, endDate } = filters;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter["appointmentTime.date"] = {};
      if (startDate)
        dateFilter["appointmentTime.date"].$gte = new Date(startDate);
      if (endDate) dateFilter["appointmentTime.date"].$lte = new Date(endDate);
    }

    const centerPerformance = await Appointment.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$serviceCenter",
          totalBookings: { $sum: 1 },
          completedBookings: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
          totalRevenue: { $sum: "$serviceDetails.actualCost" },
        },
      },
      {
        $lookup: {
          from: "servicecenters",
          localField: "_id",
          foreignField: "_id",
          as: "centerInfo",
        },
      },
      { $unwind: "$centerInfo" },
      {
        $project: {
          _id: 1,
          name: "$centerInfo.name",
          address: "$centerInfo.address",
          totalBookings: 1,
          completedBookings: 1,
          cancelledBookings: 1,
          totalRevenue: 1,
          completionRate: {
            $multiply: [
              { $divide: ["$completedBookings", "$totalBookings"] },
              100,
            ],
          },
        },
      },
      { $sort: { totalRevenue: -1 } },
    ]);

    return {
      success: true,
      data: centerPerformance,
    };
  } catch (error) {
    console.error("Error getting service center performance:", error);
    return {
      success: false,
      message: "Failed to get service center performance",
      error: error.message,
    };
  }
};

/**
 * Thống kê inventory
 */
const getInventoryStats = async (filters = {}) => {
  try {
    const { serviceCenterId } = filters;

    const centerFilter = serviceCenterId
      ? { serviceCenter: serviceCenterId }
      : {};

    // Tổng số part trong kho
    const inventoryStats = await CenterInventory.aggregate([
      { $match: centerFilter },
      {
        $group: {
          _id: null,
          totalParts: { $sum: 1 },
          totalQuantity: { $sum: "$quantity" },
          totalValue: {
            $sum: {
              $multiply: ["$quantity", "$part.price"],
            },
          },
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ["$quantity", "$minStockLevel"] }, 1, 0],
            },
          },
        },
      },
    ]);

    // Parts sắp hết hàng
    const lowStockParts = await CenterInventory.find({
      ...centerFilter,
      $expr: { $lte: ["$quantity", "$minStockLevel"] },
    })
      .populate("part")
      .populate("serviceCenter", "name")
      .limit(10);

    return {
      success: true,
      data: {
        summary: inventoryStats[0] || {
          totalParts: 0,
          totalQuantity: 0,
          totalValue: 0,
          lowStockItems: 0,
        },
        lowStockParts: lowStockParts.map((item) => ({
          part: item.part,
          serviceCenter: item.serviceCenter,
          currentStock: item.quantity,
          minStockLevel: item.minStockLevel,
          deficit: item.minStockLevel - item.quantity,
        })),
      },
    };
  } catch (error) {
    console.error("Error getting inventory stats:", error);
    return {
      success: false,
      message: "Failed to get inventory statistics",
      error: error.message,
    };
  }
};

/**
 * Recent activities
 */
const getRecentActivities = async (filters = {}) => {
  try {
    const { limit = 10 } = filters;

    // Recent bookings
    const recentBookings = await Appointment.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("customer", "fullName email")
      .populate("vehicle", "licensePlate model")
      .populate("serviceCenter", "name")
      .populate("serviceType", "name")
      .select("status appointmentTime serviceDetails createdAt");

    // Recent payments
    const recentPayments = await Payment.find({ status: "paid" })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("customer", "fullName email")
      .populate("appointment")
      .select("paymentInfo status paymentMethod createdAt");

    return {
      success: true,
      data: {
        recentBookings,
        recentPayments,
      },
    };
  } catch (error) {
    console.error("Error getting recent activities:", error);
    return {
      success: false,
      message: "Failed to get recent activities",
      error: error.message,
    };
  }
};

/**
 * Top customers by spending
 */
const getTopCustomers = async (filters = {}) => {
  try {
    const { limit = 10, startDate, endDate } = filters;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const topCustomers = await Payment.aggregate([
      { $match: { status: "paid", ...dateFilter } },
      {
        $group: {
          _id: "$customer",
          totalSpent: { $sum: "$paymentInfo.amount" },
          totalTransactions: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "customerInfo",
        },
      },
      { $unwind: "$customerInfo" },
      {
        $project: {
          _id: 1,
          fullName: "$customerInfo.fullName",
          email: "$customerInfo.email",
          phone: "$customerInfo.phone",
          totalSpent: 1,
          totalTransactions: 1,
          averageSpending: { $divide: ["$totalSpent", "$totalTransactions"] },
        },
      },
    ]);

    return {
      success: true,
      data: topCustomers,
    };
  } catch (error) {
    console.error("Error getting top customers:", error);
    return {
      success: false,
      message: "Failed to get top customers",
      error: error.message,
    };
  }
};

export default {
  getOverviewStats,
  getRevenueAnalytics,
  getBookingAnalytics,
  getCustomerGrowth,
  getServiceCenterPerformance,
  getInventoryStats,
  getRecentActivities,
  getTopCustomers,
};
