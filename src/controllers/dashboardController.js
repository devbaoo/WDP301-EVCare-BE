import dashboardService from "../services/dashboardService.js";

/**
 * @route   GET /api/dashboard/overview
 * @desc    Lấy thống kê tổng quan
 * @access  Private (Admin, Staff)
 */
const getOverviewStats = async (req, res) => {
  try {
    const { startDate, endDate, serviceCenterId } = req.query;

    const result = await dashboardService.getOverviewStats({
      startDate,
      endDate,
      serviceCenterId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getOverviewStats controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/dashboard/revenue-analytics
 * @desc    Lấy thống kê doanh thu theo thời gian
 * @access  Private (Admin, Staff)
 */
const getRevenueAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy, serviceCenterId } = req.query;

    const result = await dashboardService.getRevenueAnalytics({
      startDate,
      endDate,
      groupBy: groupBy || "day",
      serviceCenterId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getRevenueAnalytics controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/dashboard/booking-analytics
 * @desc    Lấy thống kê booking theo thời gian
 * @access  Private (Admin, Staff)
 */
const getBookingAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy, serviceCenterId } = req.query;

    const result = await dashboardService.getBookingAnalytics({
      startDate,
      endDate,
      groupBy: groupBy || "day",
      serviceCenterId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getBookingAnalytics controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/dashboard/customer-growth
 * @desc    Lấy thống kê tăng trưởng khách hàng
 * @access  Private (Admin, Staff)
 */
const getCustomerGrowth = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;

    const result = await dashboardService.getCustomerGrowth({
      startDate,
      endDate,
      groupBy: groupBy || "month",
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getCustomerGrowth controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/dashboard/service-center-performance
 * @desc    Lấy thống kê hiệu suất các service center
 * @access  Private (Admin)
 */
const getServiceCenterPerformance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const result = await dashboardService.getServiceCenterPerformance({
      startDate,
      endDate,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getServiceCenterPerformance controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/dashboard/inventory-stats
 * @desc    Lấy thống kê inventory
 * @access  Private (Admin, Staff)
 */
const getInventoryStats = async (req, res) => {
  try {
    const { serviceCenterId } = req.query;

    const result = await dashboardService.getInventoryStats({
      serviceCenterId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getInventoryStats controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/dashboard/recent-activities
 * @desc    Lấy các hoạt động gần đây
 * @access  Private (Admin, Staff)
 */
const getRecentActivities = async (req, res) => {
  try {
    const { limit } = req.query;

    const result = await dashboardService.getRecentActivities({
      limit: limit ? parseInt(limit) : 10,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getRecentActivities controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * @route   GET /api/dashboard/top-customers
 * @desc    Lấy danh sách khách hàng chi tiêu nhiều nhất
 * @access  Private (Admin, Staff)
 */
const getTopCustomers = async (req, res) => {
  try {
    const { limit, startDate, endDate } = req.query;

    const result = await dashboardService.getTopCustomers({
      limit: limit ? parseInt(limit) : 10,
      startDate,
      endDate,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error in getTopCustomers controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
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
