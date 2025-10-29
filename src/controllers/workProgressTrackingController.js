import workProgressTrackingService from "../services/workProgressTrackingService.js";

const workProgressTrackingController = {
  // Get all progress records
  getAllProgressRecords: async (req, res) => {
    try {
      const { technicianId, appointmentId, serviceDate, currentStatus } =
        req.query;
      const filters = {};

      if (technicianId) filters.technicianId = technicianId;
      if (appointmentId) filters.appointmentId = appointmentId;
      if (currentStatus) filters.currentStatus = currentStatus;

      // Handle date filtering
      if (serviceDate) {
        const date = new Date(serviceDate);
        date.setHours(0, 0, 0, 0);

        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        filters.serviceDate = {
          $gte: date,
          $lt: nextDay,
        };
      }

      const progressRecords =
        await workProgressTrackingService.getAllProgressRecords(filters);

      res.status(200).json({
        success: true,
        data: progressRecords,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch progress records",
      });
    }
  },

  // Get progress record by ID
  getProgressRecordById: async (req, res) => {
    try {
      const { id } = req.params;
      const progressRecord =
        await workProgressTrackingService.getProgressRecordById(id);

      if (!progressRecord) {
        return res.status(404).json({
          success: false,
          message: "Progress record not found",
        });
      }

      res.status(200).json({
        success: true,
        data: progressRecord,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch progress record",
      });
    }
  },

  // Create new progress record
  createProgressRecord: async (req, res) => {
    try {
      const {
        technicianId,
        appointmentId,
        serviceRecordId,
        serviceDate,
        startTime,
        currentStatus,
        milestones,
        supervisorId,
        notes,
      } = req.body;

      // Validate required fields
      if (!technicianId || !appointmentId || !serviceDate) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const newProgressRecord =
        await workProgressTrackingService.createProgressRecord({
          technicianId,
          appointmentId,
          serviceRecordId,
          serviceDate,
          startTime: startTime || new Date(),
          currentStatus: currentStatus || "not_started",
          milestones,
          supervisorId,
          notes,
        });

      res.status(201).json({
        success: true,
        data: newProgressRecord,
        message: "Progress record created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create progress record",
      });
    }
  },

  // Update progress record
  updateProgressRecord: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        serviceRecordId,
        endTime,
        currentStatus,
        progressPercentage,
        timeSpent,
        pauseTime,
        notes,
        supervisorId,
        supervisorNotes,
      } = req.body;

      const updatedRecord =
        await workProgressTrackingService.updateProgressRecord(id, {
          serviceRecordId,
          endTime,
          currentStatus,
          progressPercentage,
          timeSpent,
          pauseTime,
          notes,
          supervisorId,
          supervisorNotes,
        });

      if (!updatedRecord) {
        return res.status(404).json({
          success: false,
          message: "Progress record not found",
        });
      }

      res.status(200).json({
        success: true,
        data: updatedRecord,
        message: "Progress record updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update progress record",
      });
    }
  },

  // Delete progress record
  deleteProgressRecord: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await workProgressTrackingService.deleteProgressRecord(
        id
      );

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Progress record not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Progress record deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete progress record",
      });
    }
  },

  // Get progress records by technician
  getProgressRecordsByTechnician: async (req, res) => {
    try {
      const { technicianId } = req.params;
      const { startDate, endDate } = req.query;

      const progressRecords =
        await workProgressTrackingService.getProgressRecordsByTechnician(
          technicianId,
          startDate,
          endDate
        );

      res.status(200).json({
        success: true,
        data: progressRecords,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message || "Failed to fetch progress records by technician",
      });
    }
  },

  // Get progress record by appointment
  getProgressRecordByAppointment: async (req, res) => {
    try {
      const { appointmentId } = req.params;

      const progressRecord =
        await workProgressTrackingService.getProgressRecordByAppointment(
          appointmentId
        );

      if (!progressRecord) {
        return res.status(404).json({
          success: false,
          message: "Progress record not found for this appointment",
        });
      }

      res.status(200).json({
        success: true,
        data: progressRecord,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message || "Failed to fetch progress record by appointment",
      });
    }
  },

  // Get appointment quote details for customer to view
  getAppointmentQuote: async (req, res) => {
    try {
      const { appointmentId } = req.params;

      const result = await workProgressTrackingService.getAppointmentQuote(
        appointmentId
      );

      if (!result || !result.quote) {
        return res.status(404).json({
          success: false,
          message: "No quote found for this appointment",
        });
      }

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch appointment quote",
      });
    }
  },

  // Update progress status
  updateProgressStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, progressPercentage } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      const updatedRecord =
        await workProgressTrackingService.updateProgressStatus(
          id,
          status,
          progressPercentage
        );

      res.status(200).json({
        success: true,
        data: updatedRecord,
        message: "Progress status updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update progress status",
      });
    }
  },

  // Submit inspection results and quote
  submitInspectionAndQuote: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        vehicleCondition,
        diagnosisDetails,
        inspectionNotes,
        quoteDetails, // quoteAmount will be auto-calculated
      } = req.body;

      // Validate required fields
      if (!vehicleCondition || !diagnosisDetails) {
        return res.status(400).json({
          success: false,
          message: "Vehicle condition and diagnosis details are required",
        });
      }

      // Validate that quoteDetails is provided for quote creation
      if (!quoteDetails) {
        return res.status(400).json({
          success: false,
          message: "Quote details with items are required",
        });
      }

      // Additional validation for new quoteDetails object format
      if (
        quoteDetails &&
        typeof quoteDetails === "object" &&
        !Array.isArray(quoteDetails)
      ) {
        const { items } = quoteDetails;

        // Validate items structure
        if (items && !Array.isArray(items)) {
          return res.status(400).json({
            success: false,
            message: "Quote details items must be an array",
          });
        }

        if (items && items.length > 0) {
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (
              !item.name ||
              typeof item.quantity !== "number" ||
              typeof item.unitPrice !== "number"
            ) {
              return res.status(400).json({
                success: false,
                message: `Item ${
                  i + 1
                }: name, quantity, and unitPrice are required`,
              });
            }
            if (item.quantity <= 0) {
              return res.status(400).json({
                success: false,
                message: `Item ${i + 1}: quantity must be greater than 0`,
              });
            }
            if (item.unitPrice < 0) {
              return res.status(400).json({
                success: false,
                message: `Item ${i + 1}: unitPrice cannot be negative`,
              });
            }
          }
        } else {
          return res.status(400).json({
            success: false,
            message: "Quote must have at least one item",
          });
        }
      }

      const updatedRecord =
        await workProgressTrackingService.submitInspectionAndQuote(id, {
          vehicleCondition,
          diagnosisDetails,
          inspectionNotes,
          quoteDetails, // quoteAmount will be auto-calculated in service
        });

      res.status(200).json({
        success: true,
        data: updatedRecord,
        message: "Inspection completed and quote provided successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to submit inspection and quote",
      });
    }
  },

  // Submit inspection and quote by appointment (before progress exists)
  submitInspectionAndQuoteByAppointment: async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const {
        vehicleCondition,
        diagnosisDetails,
        inspectionNotes,
        quoteDetails,
      } = req.body;

      if (!vehicleCondition || !diagnosisDetails) {
        return res.status(400).json({
          success: false,
          message: "Vehicle condition and diagnosis details are required",
        });
      }

      if (!quoteDetails) {
        return res.status(400).json({
          success: false,
          message: "Quote details with items are required",
        });
      }

      // Basic structure validation for new object format
      if (
        quoteDetails &&
        typeof quoteDetails === "object" &&
        !Array.isArray(quoteDetails)
      ) {
        const { items } = quoteDetails;
        if (!Array.isArray(items) || items.length === 0) {
          return res.status(400).json({
            success: false,
            message: "Quote must have at least one item",
          });
        }
      }

      const actorUserId = req.user?.id || req.user?._id;

      const updatedAppointment =
        await workProgressTrackingService.submitAppointmentInspectionAndQuote(
          appointmentId,
          {
            vehicleCondition,
            diagnosisDetails,
            inspectionNotes,
            quoteDetails,
          },
          actorUserId
        );

      return res.status(200).json({
        success: true,
        data: updatedAppointment,
        message: "Inspection completed and quote provided successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to submit inspection and quote",
      });
    }
  },

  // Process quote response by appointment
  processQuoteResponseByAppointment: async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const { status, notes } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Response status is required",
        });
      }

      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be either 'approved' or 'rejected'",
        });
      }

      const updatedAppointment =
        await workProgressTrackingService.processAppointmentQuoteResponse(
          appointmentId,
          { status, notes }
        );

      return res.status(200).json({
        success: true,
        data: updatedAppointment,
        message:
          status === "approved"
            ? "Quote approved successfully"
            : "Quote rejected successfully",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to process quote response",
      });
    }
  },

  // Process customer response to quote (approve/reject)
  processQuoteResponse: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      // Validate required fields
      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Response status is required",
        });
      }

      // Validate status value
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be either 'approved' or 'rejected'",
        });
      }

      const updatedRecord =
        await workProgressTrackingService.processQuoteResponse(id, {
          status,
          notes,
        });

      res.status(200).json({
        success: true,
        data: updatedRecord,
        message:
          status === "approved"
            ? "Quote approved successfully"
            : "Quote rejected successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process quote response",
      });
    }
  },

  // Start maintenance after quote approval
  startMaintenance: async (req, res) => {
    try {
      const { id } = req.params;

      const updatedRecord = await workProgressTrackingService.startMaintenance(
        id
      );

      res.status(200).json({
        success: true,
        data: updatedRecord,
        message: "Maintenance started successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to start maintenance",
      });
    }
  },

  // Complete maintenance service
  completeMaintenance: async (req, res) => {
    try {
      const { id } = req.params;
      const { notes, workDone, recommendations } = req.body;

      const updatedRecord =
        await workProgressTrackingService.completeMaintenance(id, {
          notes,
          workDone,
          recommendations,
        });

      res.status(200).json({
        success: true,
        data: updatedRecord,
        message: "Maintenance completed successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to complete maintenance",
      });
    }
  },

  // Process cash payment by staff
  processCashPayment: async (req, res) => {
    try {
      const { id } = req.params;
      const { staffId, paidAmount, notes } = req.body;

      // Validate required fields
      if (!staffId) {
        return res.status(400).json({
          success: false,
          message: "Staff ID is required",
        });
      }

      if (!paidAmount || paidAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid payment amount is required",
        });
      }

      const updatedRecord =
        await workProgressTrackingService.processCashPayment(id, {
          staffId,
          paidAmount,
          notes,
        });

      res.status(200).json({
        success: true,
        data: updatedRecord,
        message: "Cash payment processed successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to process cash payment",
      });
    }
  },

  // Add milestone
  addMilestone: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: "Milestone name is required",
        });
      }

      const updatedRecord = await workProgressTrackingService.addMilestone(id, {
        name,
        description,
      });

      res.status(200).json({
        success: true,
        data: updatedRecord,
        message: "Milestone added successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to add milestone",
      });
    }
  },

  // Complete milestone
  completeMilestone: async (req, res) => {
    try {
      const { id, milestoneId } = req.params;

      const updatedRecord = await workProgressTrackingService.completeMilestone(
        id,
        milestoneId
      );

      res.status(200).json({
        success: true,
        data: updatedRecord,
        message: "Milestone completed successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to complete milestone",
      });
    }
  },

  // Report issue
  reportIssue: async (req, res) => {
    try {
      const { id } = req.params;
      const { description } = req.body;

      if (!description) {
        return res.status(400).json({
          success: false,
          message: "Issue description is required",
        });
      }

      const updatedRecord = await workProgressTrackingService.reportIssue(id, {
        description,
      });

      res.status(200).json({
        success: true,
        data: updatedRecord,
        message: "Issue reported successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to report issue",
      });
    }
  },

  // Resolve issue
  resolveIssue: async (req, res) => {
    try {
      const { id, issueId } = req.params;

      const updatedRecord = await workProgressTrackingService.resolveIssue(
        id,
        issueId
      );

      res.status(200).json({
        success: true,
        data: updatedRecord,
        message: "Issue resolved successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to resolve issue",
      });
    }
  },

  // Add supervisor notes
  addSupervisorNotes: async (req, res) => {
    try {
      const { id } = req.params;
      const { supervisorId, notes } = req.body;

      if (!supervisorId || !notes) {
        return res.status(400).json({
          success: false,
          message: "Supervisor ID and notes are required",
        });
      }

      const updatedRecord =
        await workProgressTrackingService.addSupervisorNotes(
          id,
          supervisorId,
          notes
        );

      res.status(200).json({
        success: true,
        data: updatedRecord,
        message: "Supervisor notes added successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to add supervisor notes",
      });
    }
  },

  // Calculate efficiency
  calculateEfficiency: async (req, res) => {
    try {
      const { id } = req.params;

      const updatedRecord =
        await workProgressTrackingService.calculateEfficiency(id);

      res.status(200).json({
        success: true,
        data: updatedRecord,
        message: "Efficiency calculated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to calculate efficiency",
      });
    }
  },

  // Get technician performance metrics
  getTechnicianPerformance: async (req, res) => {
    try {
      const { technicianId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
      }

      const performanceMetrics =
        await workProgressTrackingService.getTechnicianPerformance(
          technicianId,
          startDate,
          endDate
        );

      res.status(200).json({
        success: true,
        data: performanceMetrics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message || "Failed to fetch technician performance metrics",
      });
    }
  },

  // Get service center performance metrics
  getServiceCenterPerformance: async (req, res) => {
    try {
      const { centerId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: "Start date and end date are required",
        });
      }

      const performanceMetrics =
        await workProgressTrackingService.getServiceCenterPerformance(
          centerId,
          startDate,
          endDate
        );

      res.status(200).json({
        success: true,
        data: performanceMetrics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message || "Failed to fetch service center performance metrics",
      });
    }
  },

  // Add technician to work progress
  addTechnicianToProgress: async (req, res) => {
    try {
      const { id } = req.params;
      const { technicianId, role } = req.body;

      if (!technicianId) {
        return res.status(400).json({
          success: false,
          message: "Technician ID is required",
        });
      }

      const result = await workProgressTrackingService.addTechnicianToProgress(
        id,
        {
          technicianId,
          role: role || "assistant",
        }
      );

      res.status(200).json({
        success: true,
        data: result,
        message: "Technician added to work progress successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to add technician to work progress",
      });
    }
  },

  // Remove technician from work progress
  removeTechnicianFromProgress: async (req, res) => {
    try {
      const { id, technicianId } = req.params;

      const result =
        await workProgressTrackingService.removeTechnicianFromProgress(
          id,
          technicianId
        );

      res.status(200).json({
        success: true,
        data: result,
        message: "Technician removed from work progress successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message || "Failed to remove technician from work progress",
      });
    }
  },
};

export default workProgressTrackingController;
