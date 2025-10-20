import mongoose from "mongoose";
import WorkProgressTracking from "../models/workProgressTracking.js";
import User from "../models/user.js";
import Appointment from "../models/appointment.js";
import ServiceRecord from "../models/serviceRecord.js";
import TechnicianSchedule from "../models/technicianSchedule.js";
import CenterInventory from "../models/centerInventory.js";
import invoiceService from "./invoiceService.js";

// Helper function to calculate total amount from quoteDetails
const calculateQuoteAmount = (quoteDetails) => {
  if (typeof quoteDetails !== "object" || !quoteDetails) {
    return 0;
  }

  let total = 0;

  // Calculate items total only
  if (Array.isArray(quoteDetails.items)) {
    total += quoteDetails.items.reduce((sum, item) => {
      return sum + (item.quantity || 0) * (item.unitPrice || 0);
    }, 0);
  }

  return total;
};

const workProgressTrackingService = {
  // Internal helper: set technician availability to available for the appointment date
  async _setTechnicianAvailableForAppointment(technicianId, appointmentId) {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(technicianId) ||
        !mongoose.Types.ObjectId.isValid(appointmentId)
      ) {
        return;
      }
      const appointment = await Appointment.findById(appointmentId).select(
        "appointmentTime.date"
      );
      if (!appointment || !appointment.appointmentTime?.date) return;

      // Normalize date range for the work day
      const workDate = new Date(appointment.appointmentTime.date);
      const startOfDay = new Date(workDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(workDate);
      endOfDay.setHours(23, 59, 59, 999);

      await TechnicianSchedule.findOneAndUpdate(
        {
          technicianId,
          workDate: { $gte: startOfDay, $lte: endOfDay },
        },
        { $set: { availability: "available" } },
        { new: true }
      );
    } catch (_) {
      // best-effort; do not block main flow
    }
  },
  // Get all progress records with optional filtering
  getAllProgressRecords: async (filters = {}) => {
    try {
      return await WorkProgressTracking.find(filters)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId")
        .populate("supervisorId", "firstName lastName email")
        .sort({ serviceDate: -1, startTime: -1 });
    } catch (error) {
      throw new Error(`Error fetching progress records: ${error.message}`);
    }
  },

  // Get progress record by ID
  getProgressRecordById: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      return await WorkProgressTracking.findById(id)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId")
        .populate("supervisorId", "firstName lastName email");
    } catch (error) {
      throw new Error(`Error fetching progress record: ${error.message}`);
    }
  },

  // Create new progress record with technician team
  createProgressRecord: async (progressData) => {
    try {
      // Check if primary technician exists
      const technicianExists = await User.findById(progressData.technicianId);
      if (!technicianExists) {
        throw new Error("Primary technician not found");
      }

      // Check if appointment exists and get service type requirements
      const appointment = await Appointment.findById(
        progressData.appointmentId
      ).populate(
        "serviceType",
        "serviceDetails.minTechnicians serviceDetails.maxTechnicians name"
      );
      if (!appointment) {
        throw new Error("Appointment not found");
      }

      // Validate technician team size against service requirements
      const totalTechnicians =
        1 + (progressData.technicians ? progressData.technicians.length : 0);
      const minRequired =
        appointment.serviceType?.serviceDetails?.minTechnicians || 1;
      const maxAllowed =
        appointment.serviceType?.serviceDetails?.maxTechnicians || 1;

      if (totalTechnicians < minRequired) {
        throw new Error(
          `Service "${appointment.serviceType?.name}" requires at least ${minRequired} technician(s). Currently assigned: ${totalTechnicians}`
        );
      }

      if (totalTechnicians > maxAllowed) {
        throw new Error(
          `Service "${appointment.serviceType?.name}" allows maximum ${maxAllowed} technician(s). Currently assigned: ${totalTechnicians}`
        );
      }

      // Validate additional technicians exist
      if (progressData.technicians && progressData.technicians.length > 0) {
        for (const tech of progressData.technicians) {
          const techExists = await User.findById(tech.technicianId);
          if (!techExists) {
            throw new Error(
              `Technician with ID ${tech.technicianId} not found`
            );
          }
          if (
            tech.technicianId.toString() ===
            progressData.technicianId.toString()
          ) {
            throw new Error(
              "Primary technician cannot be in additional technicians list"
            );
          }
        }
      }

      // Check if service record exists if provided
      if (progressData.serviceRecordId) {
        const serviceRecordExists = await ServiceRecord.findById(
          progressData.serviceRecordId
        );
        if (!serviceRecordExists) {
          throw new Error("Service record not found");
        }
      }

      // Check if supervisor exists if provided
      if (progressData.supervisorId) {
        const supervisorExists = await User.findById(progressData.supervisorId);
        if (!supervisorExists) {
          throw new Error("Supervisor not found");
        }
      }

      // Check if progress record already exists for this appointment
      const existingRecord = await WorkProgressTracking.findOne({
        appointmentId: progressData.appointmentId,
      });

      if (existingRecord) {
        throw new Error("Progress record already exists for this appointment");
      }

      // Create new progress record
      const newProgressRecord = new WorkProgressTracking(progressData);
      await newProgressRecord.save();

      return await WorkProgressTracking.findById(newProgressRecord._id)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId")
        .populate("supervisorId", "firstName lastName email");
    } catch (error) {
      throw new Error(`Error creating progress record: ${error.message}`);
    }
  },

  // Update progress record
  updateProgressRecord: async (id, updateData) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      // Check if supervisor exists if provided
      if (
        updateData.supervisorId &&
        !mongoose.Types.ObjectId.isValid(updateData.supervisorId)
      ) {
        throw new Error("Invalid supervisor ID");
      }

      const progressRecord = await WorkProgressTracking.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId")
        .populate("supervisorId", "firstName lastName email");

      return progressRecord;
    } catch (error) {
      throw new Error(`Error updating progress record: ${error.message}`);
    }
  },

  // Delete progress record
  deleteProgressRecord: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      const progressRecord = await WorkProgressTracking.findByIdAndDelete(id);
      return progressRecord;
    } catch (error) {
      throw new Error(`Error deleting progress record: ${error.message}`);
    }
  },

  // Get progress records by technician
  getProgressRecordsByTechnician: async (technicianId, startDate, endDate) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(technicianId)) {
        throw new Error("Invalid technician ID");
      }

      const query = { technicianId };

      // Add date range filter if provided
      if (startDate && endDate) {
        query.serviceDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else if (startDate) {
        query.serviceDate = { $gte: new Date(startDate) };
      } else if (endDate) {
        query.serviceDate = { $lte: new Date(endDate) };
      }

      return await WorkProgressTracking.find(query)
        .populate("appointmentId")
        .populate("serviceRecordId")
        .sort({ serviceDate: -1, startTime: -1 });
    } catch (error) {
      throw new Error(
        `Error fetching progress records by technician: ${error.message}`
      );
    }
  },

  // Get progress record by appointment
  getProgressRecordByAppointment: async (appointmentId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
        throw new Error("Invalid appointment ID");
      }

      return await WorkProgressTracking.findOne({ appointmentId })
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId")
        .populate("supervisorId", "firstName lastName email");
    } catch (error) {
      throw new Error(
        `Error fetching progress record by appointment: ${error.message}`
      );
    }
  },

  // Update progress status
  updateProgressStatus: async (id, status, progressPercentage = null) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      // Validate status
      const validStatuses = [
        "not_started",
        "in_progress",
        "paused",
        "completed",
        "delayed",
        "inspection_completed",
        "quote_provided",
        "quote_approved",
        "quote_rejected",
      ];
      if (!validStatuses.includes(status)) {
        throw new Error(
          "Invalid status. Must be one of: not_started, in_progress, paused, completed, delayed, inspection_completed, quote_provided, quote_approved, quote_rejected"
        );
      }

      const updateData = { currentStatus: status };

      // Update progress percentage if provided
      if (progressPercentage !== null) {
        if (progressPercentage < 0 || progressPercentage > 100) {
          throw new Error("Progress percentage must be between 0 and 100");
        }
        updateData.progressPercentage = progressPercentage;
      }

      // If status is completed, set progress to 100% and endTime to now
      if (status === "completed") {
        updateData.progressPercentage = 100;
        updateData.endTime = new Date();
      }

      // If status is in_progress and was previously not_started, set startTime to now
      const progressRecord = await WorkProgressTracking.findById(id);
      if (
        progressRecord &&
        progressRecord.currentStatus === "not_started" &&
        status === "in_progress"
      ) {
        updateData.startTime = new Date();
      }

      const updatedRecord = await WorkProgressTracking.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId");

      // When completed, free up technician availability for that day
      if (
        status === "completed" &&
        updatedRecord?.technicianId &&
        updatedRecord?.appointmentId
      ) {
        try {
          await workProgressTrackingService._setTechnicianAvailableForAppointment(
            updatedRecord.technicianId._id || updatedRecord.technicianId,
            updatedRecord.appointmentId._id || updatedRecord.appointmentId
          );
        } catch (_) {}
      }

      return updatedRecord;
    } catch (error) {
      throw new Error(`Error updating progress status: ${error.message}`);
    }
  },

  // Submit inspection results and quote
  submitInspectionAndQuote: async (id, inspectionData) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      const progressRecord = await WorkProgressTracking.findById(id);
      if (!progressRecord) {
        throw new Error("Progress record not found");
      }

      // Validate required fields
      if (
        !inspectionData.vehicleCondition ||
        !inspectionData.diagnosisDetails
      ) {
        throw new Error("Vehicle condition and diagnosis details are required");
      }

      if (
        inspectionData.quoteAmount !== undefined &&
        inspectionData.quoteAmount < 0
      ) {
        throw new Error("Quote amount cannot be negative");
      }

      // Validate quoteDetails structure if provided
      if (inspectionData.quoteDetails) {
        // Support both string (legacy) and object (new) format
        if (typeof inspectionData.quoteDetails === "object") {
          const { items } = inspectionData.quoteDetails;

          // Validate items if provided
          if (items && Array.isArray(items)) {
            for (const item of items) {
              if (
                !item.name ||
                typeof item.quantity !== "number" ||
                typeof item.unitPrice !== "number"
              ) {
                throw new Error(
                  "Each item must have name, quantity, and unitPrice"
                );
              }
              if (item.quantity <= 0 || item.unitPrice < 0) {
                throw new Error(
                  "Item quantity must be positive and unitPrice cannot be negative"
                );
              }
            }
          }

          // Auto-calculate quote amount from items (always override any provided quoteAmount)
          const calculatedAmount = calculateQuoteAmount(
            inspectionData.quoteDetails
          );
          if (calculatedAmount > 0) {
            inspectionData.quoteAmount = calculatedAmount;
          } else {
            throw new Error(
              "Quote must have at least one item with valid quantity and price"
            );
          }
        }
      }

      // Update inspection data
      const updateData = {
        currentStatus: "inspection_completed",
        "inspection.vehicleCondition": inspectionData.vehicleCondition,
        "inspection.diagnosisDetails": inspectionData.diagnosisDetails,
        "inspection.inspectionNotes": inspectionData.inspectionNotes || "",
        "inspection.inspectionCompletedAt": new Date(),
        "inspection.isInspectionOnly": true,
      };

      // If quote is provided, update quote data
      if (
        inspectionData.quoteAmount !== undefined &&
        inspectionData.quoteDetails
      ) {
        updateData.currentStatus = "quote_provided";
        updateData["quote.quoteAmount"] = inspectionData.quoteAmount;
        updateData["quote.quoteDetails"] = inspectionData.quoteDetails;
        updateData["quote.quotedAt"] = new Date();
        updateData["quote.quoteStatus"] = "pending";

        // Automatically deduct parts from inventory when adding to quote
        try {
          if (
            typeof inspectionData.quoteDetails === "object" &&
            Array.isArray(inspectionData.quoteDetails.items) &&
            inspectionData.quoteDetails.items.length > 0
          ) {
            // Get the service center ID from the appointment
            const appointment = await Appointment.findById(
              progressRecord.appointmentId
            );
            if (appointment && appointment.serviceCenter) {
              const serviceCenterId = appointment.serviceCenter;

              // Process each part in the quote
              for (const item of inspectionData.quoteDetails.items) {
                if (item.partId && item.quantity > 0) {
                  // Find the inventory item for this part in this service center
                  const inventoryItem = await CenterInventory.findOne({
                    centerId: serviceCenterId,
                    partId: item.partId,
                  });

                  if (inventoryItem) {
                    // Create a transaction to deduct the inventory
                    const { default: inventoryService } = await import(
                      "./inventoryService.js"
                    );
                    await inventoryService.createTransaction(
                      {
                        inventoryId: inventoryItem._id,
                        transactionType: "out",
                        quantity: item.quantity,
                        referenceType: "quote",
                        referenceId: progressRecord._id,
                        notes: `Auto-deducted for inspection quote #${progressRecord._id}`,
                      },
                      progressRecord.technicianId
                    ); // Use technician as the user who performed the transaction
                  }
                }
              }
            }
          }
        } catch (e) {
          console.error("Error deducting inventory for quote items:", e);
          // Don't throw error to avoid blocking the quote submission process
        }
      }

      // Update the appointment status
      const appointment = await Appointment.findById(
        progressRecord.appointmentId
      );
      if (appointment) {
        // Append status history for audit
        try {
          appointment.statusHistory = appointment.statusHistory || [];
          appointment.statusHistory.push({
            from: appointment.status,
            to: "inspection_completed",
            at: new Date(),
          });
        } catch (_) {}
        if (updateData.currentStatus === "quote_provided") {
          appointment.status = "quote_provided";
          appointment.inspectionAndQuote = {
            inspectionNotes: inspectionData.inspectionNotes || "",
            inspectionCompletedAt: new Date(),
            vehicleCondition: inspectionData.vehicleCondition,
            diagnosisDetails: inspectionData.diagnosisDetails,
            quoteAmount: inspectionData.quoteAmount,
            quoteDetails: inspectionData.quoteDetails,
            quotedAt: new Date(),
            quoteStatus: "pending",
          };
          // Notify customer that quote is provided
          try {
            await (
              await import("./emailService.js")
            ).sendQuoteProvided(appointment);
          } catch (e) {
            console.error("Send quote provided email failed:", e);
          }
        } else {
          appointment.status = "inspection_completed";
          appointment.inspectionAndQuote = {
            inspectionNotes: inspectionData.inspectionNotes || "",
            inspectionCompletedAt: new Date(),
            vehicleCondition: inspectionData.vehicleCondition,
            diagnosisDetails: inspectionData.diagnosisDetails,
          };
        }
        await appointment.save();
      }

      const updatedRecord = await WorkProgressTracking.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId");

      return updatedRecord;
    } catch (error) {
      throw new Error(
        `Error submitting inspection and quote: ${error.message}`
      );
    }
  },

  // Process customer response to quote (approve/reject)
  processQuoteResponse: async (id, response) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      const progressRecord = await WorkProgressTracking.findById(id);
      if (!progressRecord) {
        throw new Error("Progress record not found");
      }

      // Validate that there is a quote to respond to
      if (progressRecord.currentStatus !== "quote_provided") {
        throw new Error("No quote has been provided yet for this record");
      }

      // Validate response
      if (!["approved", "rejected"].includes(response.status)) {
        throw new Error(
          "Response status must be either 'approved' or 'rejected'"
        );
      }

      // Update quote status
      const updateData = {
        "quote.quoteStatus": response.status,
        "quote.customerResponseAt": new Date(),
        currentStatus:
          response.status === "approved" ? "quote_approved" : "quote_rejected",
      };

      // If notes are provided, add them
      if (response.notes) {
        updateData["quote.customerResponseNotes"] = response.notes;
      }

      // Update the appointment status
      const appointment = await Appointment.findById(
        progressRecord.appointmentId
      );
      if (appointment) {
        if (response.status === "approved") {
          try {
            appointment.statusHistory = appointment.statusHistory || [];
            appointment.statusHistory.push({
              from: appointment.status,
              to: "quote_approved",
              at: new Date(),
            });
          } catch (_) {}
          appointment.status = "quote_approved";
          appointment.inspectionAndQuote.quoteStatus = "approved";
          appointment.inspectionAndQuote.customerResponseAt = new Date();
          appointment.inspectionAndQuote.customerResponseNotes =
            response.notes || "";
          // Auto-create reservation from quoteDetails if available
          try {
            const quoteDetails = appointment.inspectionAndQuote?.quoteDetails;
            if (
              quoteDetails &&
              Array.isArray(quoteDetails.items) &&
              quoteDetails.items.length > 0
            ) {
              const items = quoteDetails.items
                .filter((it) => it.partId && it.quantity > 0)
                .map((it) => ({ partId: it.partId, quantity: it.quantity }));
              if (items.length > 0) {
                const { default: reservationService } = await import(
                  "./inventoryReservationService.js"
                );
                await reservationService.hold({
                  appointmentId: appointment._id,
                  serviceCenterId: appointment.serviceCenter,
                  items,
                  expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
                  notes: "Auto-reservation from approved quote",
                });
              }
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.error("Auto reservation from quote error:", e);
          }
          // Send customer email for quote approved (best-effort)
          try {
            await (
              await import("./emailService.js")
            ).sendQuoteApproved(appointment);
          } catch (e) {
            console.error("Send quote approved email failed:", e);
          }
        } else {
          try {
            appointment.statusHistory = appointment.statusHistory || [];
            appointment.statusHistory.push({
              from: appointment.status,
              to: "quote_rejected",
              at: new Date(),
            });
          } catch (_) {}
          appointment.status = "quote_rejected";
          appointment.inspectionAndQuote.quoteStatus = "rejected";
          appointment.inspectionAndQuote.customerResponseAt = new Date();
          appointment.inspectionAndQuote.customerResponseNotes =
            response.notes || "";
        }
        await appointment.save();
        // Notify customer of quote rejection
        if (response.status === "rejected") {
          try {
            await (
              await import("./emailService.js")
            ).sendQuoteRejected(appointment);
          } catch (e) {
            console.error("Send quote rejected email failed:", e);
          }
        }
      }

      const updatedRecord = await WorkProgressTracking.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId");

      return updatedRecord;
    } catch (error) {
      throw new Error(`Error processing quote response: ${error.message}`);
    }
  },

  // Start maintenance after quote approval
  startMaintenance: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      const progressRecord = await WorkProgressTracking.findById(id);
      if (!progressRecord) {
        throw new Error("Progress record not found");
      }

      // Validate that quote has been approved
      if (progressRecord.currentStatus !== "quote_approved") {
        throw new Error(
          "Cannot start maintenance: quote has not been approved"
        );
      }

      // Update status to maintenance in progress
      const updateData = {
        currentStatus: "in_progress",
        progressPercentage: 25, // Reset progress percentage for maintenance phase
      };

      // Update the appointment status
      const appointment = await Appointment.findById(
        progressRecord.appointmentId
      );
      if (appointment) {
        try {
          appointment.statusHistory = appointment.statusHistory || [];
          appointment.statusHistory.push({
            from: appointment.status,
            to: "maintenance_in_progress",
            at: new Date(),
          });
        } catch (_) {}
        appointment.status = "maintenance_in_progress";
        await appointment.save();
        // Notify customer maintenance started
        try {
          await (
            await import("./emailService.js")
          ).sendMaintenanceStarted(appointment);
        } catch (e) {
          console.error("Send maintenance started email failed:", e);
        }
      }

      const updatedRecord = await WorkProgressTracking.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId");

      return updatedRecord;
    } catch (error) {
      throw new Error(`Error starting maintenance: ${error.message}`);
    }
  },

  // Complete maintenance service
  completeMaintenance: async (id, maintenanceData) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      const progressRecord = await WorkProgressTracking.findById(id);
      if (!progressRecord) {
        throw new Error("Progress record not found");
      }

      // Validate that maintenance is in progress
      if (progressRecord.currentStatus !== "in_progress") {
        throw new Error(
          "Cannot complete maintenance: maintenance is not in progress"
        );
      }

      // Update status to maintenance completed
      const updateData = {
        currentStatus: "completed",
        progressPercentage: 100,
        endTime: new Date(),
        notes: maintenanceData.notes || progressRecord.notes,
      };

      // Update the appointment status
      const appointment = await Appointment.findById(
        progressRecord.appointmentId
      );
      if (appointment) {
        try {
          appointment.statusHistory = appointment.statusHistory || [];
          appointment.statusHistory.push({
            from: appointment.status,
            to: "maintenance_completed",
            at: new Date(),
          });
        } catch (_) {}
        appointment.status = "maintenance_completed";
        appointment.completion = {
          isCompleted: true,
          completedAt: new Date(),
          completedBy: progressRecord.technicianId,
          workDone: maintenanceData.workDone || "",
          recommendations: maintenanceData.recommendations || "",
        };
        await appointment.save();
        // Notify customer maintenance completed
        try {
          await (
            await import("./emailService.js")
          ).sendMaintenanceCompleted(appointment);
        } catch (e) {
          console.error("Send maintenance completed email failed:", e);
        }

        // Auto-create invoice (draft) and send via email (no PDF)
        try {
          const invResult = await invoiceService.createFromAppointment(
            appointment._id,
            {}
          );
          if (invResult?.success && invResult.data?._id) {
            await invoiceService.sendInvoiceEmail(invResult.data._id);
          }
        } catch (e) {
          // Do not fail maintenance completion on invoice/email error
          // eslint-disable-next-line no-console
          console.error("Auto invoice/email after maintenance error:", e);
        }
      }

      const updatedRecord = await WorkProgressTracking.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId");

      // Free up technician availability for that day after completion
      if (updatedRecord?.technicianId && updatedRecord?.appointmentId) {
        try {
          await workProgressTrackingService._setTechnicianAvailableForAppointment(
            updatedRecord.technicianId._id || updatedRecord.technicianId,
            updatedRecord.appointmentId._id || updatedRecord.appointmentId
          );
        } catch (_) {}
      }

      return updatedRecord;
    } catch (error) {
      throw new Error(`Error completing maintenance: ${error.message}`);
    }
  },

  // Process cash payment by staff
  processCashPayment: async (id, paymentData) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      const progressRecord = await WorkProgressTracking.findById(id);
      if (!progressRecord) {
        throw new Error("Progress record not found");
      }

      // Validate that maintenance is completed
      if (progressRecord.currentStatus !== "completed") {
        throw new Error("Cannot process payment: maintenance is not completed");
      }

      // Validate payment data
      if (!paymentData.staffId) {
        throw new Error("Staff ID is required");
      }

      if (!mongoose.Types.ObjectId.isValid(paymentData.staffId)) {
        throw new Error("Invalid staff ID");
      }

      if (!paymentData.paidAmount || paymentData.paidAmount <= 0) {
        throw new Error("Valid payment amount is required");
      }

      // Update payment details
      const updateData = {
        "paymentDetails.paymentMethod": "cash",
        "paymentDetails.paymentStatus": "paid",
        "paymentDetails.paidAmount": paymentData.paidAmount,
        "paymentDetails.paidAt": new Date(),
        "paymentDetails.processedBy": paymentData.staffId,
      };

      // Update the appointment status and payment info
      const appointment = await Appointment.findById(
        progressRecord.appointmentId
      );
      if (appointment) {
        appointment.status = "completed";
        appointment.payment = {
          method: "cash",
          status: "paid",
          amount: paymentData.paidAmount,
          paidAt: new Date(),
          notes: paymentData.notes || "",
        };
        await appointment.save();
        // Send payment receipt email
        try {
          await (
            await import("./emailService.js")
          ).sendPaymentReceipt(appointment);
        } catch (e) {
          console.error("Send payment receipt email failed:", e);
        }
      }

      const updatedRecord = await WorkProgressTracking.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId")
        .populate("paymentDetails.processedBy", "firstName lastName email");

      // Free any technician schedules that had this appointment assigned
      try {
        if (appointment) {
          const schedules = await TechnicianSchedule.find({
            assignedAppointments: appointment._id,
          });

          for (const sched of schedules) {
            const updatedSched = await TechnicianSchedule.findByIdAndUpdate(
              sched._id,
              { $pull: { assignedAppointments: appointment._id } },
              { new: true, runValidators: true }
            )
              .populate("technicianId", "firstName lastName email phoneNumber")
              .populate("centerId", "name address")
              .populate("assignedAppointments");

            if (updatedSched) {
              // mark available regardless of other appointments to ensure technicians are freed
              updatedSched.availability = "available";
              await updatedSched.save();
            }
          }
        }
      } catch (e) {
        // best-effort: do not fail payment on schedule cleanup errors
        // eslint-disable-next-line no-console
        console.error("Error freeing technician schedules after payment:", e);
      }

      return updatedRecord;
    } catch (error) {
      throw new Error(`Error processing cash payment: ${error.message}`);
    }
  },

  // Add milestone
  addMilestone: async (id, milestone) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      if (!milestone.name) {
        throw new Error("Milestone name is required");
      }

      const updatedRecord = await WorkProgressTracking.findByIdAndUpdate(
        id,
        {
          $push: {
            milestones: {
              name: milestone.name,
              description: milestone.description || "",
              status: "pending",
            },
          },
        },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId");

      return updatedRecord;
    } catch (error) {
      throw new Error(`Error adding milestone: ${error.message}`);
    }
  },

  // Complete milestone
  completeMilestone: async (id, milestoneId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      const progressRecord = await WorkProgressTracking.findById(id);
      if (!progressRecord) {
        throw new Error("Progress record not found");
      }

      // Find the milestone
      const milestoneIndex = progressRecord.milestones.findIndex(
        (m) => m._id.toString() === milestoneId
      );

      if (milestoneIndex === -1) {
        throw new Error("Milestone not found");
      }

      // Update the milestone
      progressRecord.milestones[milestoneIndex].status = "completed";
      progressRecord.milestones[milestoneIndex].completedAt = new Date();

      // Calculate new progress percentage based on completed milestones
      const totalMilestones = progressRecord.milestones.length;
      const completedMilestones = progressRecord.milestones.filter(
        (m) => m.status === "completed"
      ).length;

      if (totalMilestones > 0) {
        progressRecord.progressPercentage = Math.round(
          (completedMilestones / totalMilestones) * 100
        );
      }

      await progressRecord.save();

      return await WorkProgressTracking.findById(id)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId");
    } catch (error) {
      throw new Error(`Error completing milestone: ${error.message}`);
    }
  },

  // Report issue
  reportIssue: async (id, issue) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      if (!issue.description) {
        throw new Error("Issue description is required");
      }

      const updatedRecord = await WorkProgressTracking.findByIdAndUpdate(
        id,
        {
          $push: {
            issues: {
              description: issue.description,
              reportedAt: new Date(),
              status: "open",
            },
          },
        },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId");

      return updatedRecord;
    } catch (error) {
      throw new Error(`Error reporting issue: ${error.message}`);
    }
  },

  // Resolve issue
  resolveIssue: async (id, issueId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      const progressRecord = await WorkProgressTracking.findById(id);
      if (!progressRecord) {
        throw new Error("Progress record not found");
      }

      // Find the issue
      const issueIndex = progressRecord.issues.findIndex(
        (i) => i._id.toString() === issueId
      );

      if (issueIndex === -1) {
        throw new Error("Issue not found");
      }

      // Update the issue
      progressRecord.issues[issueIndex].status = "resolved";
      progressRecord.issues[issueIndex].resolvedAt = new Date();

      await progressRecord.save();

      return await WorkProgressTracking.findById(id)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId");
    } catch (error) {
      throw new Error(`Error resolving issue: ${error.message}`);
    }
  },

  // Add supervisor notes
  addSupervisorNotes: async (id, supervisorId, notes) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      if (!mongoose.Types.ObjectId.isValid(supervisorId)) {
        throw new Error("Invalid supervisor ID");
      }

      if (!notes) {
        throw new Error("Notes are required");
      }

      // Check if supervisor exists
      const supervisorExists = await User.findById(supervisorId);
      if (!supervisorExists) {
        throw new Error("Supervisor not found");
      }

      const updatedRecord = await WorkProgressTracking.findByIdAndUpdate(
        id,
        {
          $set: {
            supervisorId,
            supervisorNotes: notes,
          },
        },
        { new: true, runValidators: true }
      )
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId")
        .populate("supervisorId", "firstName lastName email");

      return updatedRecord;
    } catch (error) {
      throw new Error(`Error adding supervisor notes: ${error.message}`);
    }
  },

  // Calculate and update efficiency
  calculateEfficiency: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid progress record ID");
      }

      const progressRecord = await WorkProgressTracking.findById(id);
      if (!progressRecord) {
        throw new Error("Progress record not found");
      }

      // Can only calculate efficiency if work is completed
      if (
        progressRecord.currentStatus !== "completed" ||
        !progressRecord.endTime
      ) {
        throw new Error("Work must be completed to calculate efficiency");
      }

      // Get the appointment to check estimated service time
      const appointment = await Appointment.findById(
        progressRecord.appointmentId
      ).populate("serviceTypeId");

      if (!appointment || !appointment.serviceTypeId) {
        throw new Error(
          "Cannot calculate efficiency: missing appointment or service type data"
        );
      }

      // Calculate actual time spent in minutes
      const startTime = new Date(progressRecord.startTime);
      const endTime = new Date(progressRecord.endTime);
      const actualTimeInMinutes = (endTime - startTime) / (1000 * 60);

      // Get estimated time from service type
      const estimatedTimeInMinutes =
        appointment.serviceTypeId.estimatedTime || 60; // Default to 60 minutes if not specified

      // Calculate efficiency (estimated time / actual time * 100)
      // Higher efficiency means the job was done faster than estimated
      let efficiency = (estimatedTimeInMinutes / actualTimeInMinutes) * 100;

      // Cap efficiency at 100%
      efficiency = Math.min(efficiency, 100);

      // Update the record
      progressRecord.timeSpent = Math.round(actualTimeInMinutes);
      progressRecord.efficiency = Math.round(efficiency);

      await progressRecord.save();

      return await WorkProgressTracking.findById(id)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate("appointmentId")
        .populate("serviceRecordId");
    } catch (error) {
      throw new Error(`Error calculating efficiency: ${error.message}`);
    }
  },

  // Get technician performance metrics
  getTechnicianPerformance: async (technicianId, startDate, endDate) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(technicianId)) {
        throw new Error("Invalid technician ID");
      }

      const query = {
        technicianId,
        currentStatus: "completed",
      };

      // Add date range filter
      if (startDate && endDate) {
        query.serviceDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else if (startDate) {
        query.serviceDate = { $gte: new Date(startDate) };
      } else if (endDate) {
        query.serviceDate = { $lte: new Date(endDate) };
      }

      const completedRecords = await WorkProgressTracking.find(query)
        .populate("appointmentId")
        .populate("serviceRecordId");

      // Calculate performance metrics
      const totalJobs = completedRecords.length;
      let totalEfficiency = 0;
      let totalTimeSpent = 0;
      let totalQualityScore = 0;
      let jobsWithQualityScore = 0;
      let issueCount = 0;

      completedRecords.forEach((record) => {
        if (record.efficiency) {
          totalEfficiency += record.efficiency;
        }

        if (record.timeSpent) {
          totalTimeSpent += record.timeSpent;
        }

        if (record.qualityScore) {
          totalQualityScore += record.qualityScore;
          jobsWithQualityScore++;
        }

        if (record.issues && record.issues.length > 0) {
          issueCount += record.issues.length;
        }
      });

      const metrics = {
        technicianId,
        totalJobsCompleted: totalJobs,
        averageEfficiency:
          totalJobs > 0 ? Math.round(totalEfficiency / totalJobs) : 0,
        averageTimeSpentPerJob:
          totalJobs > 0 ? Math.round(totalTimeSpent / totalJobs) : 0,
        averageQualityScore:
          jobsWithQualityScore > 0
            ? Math.round(totalQualityScore / jobsWithQualityScore)
            : 0,
        totalIssuesReported: issueCount,
        issuesPerJob: totalJobs > 0 ? (issueCount / totalJobs).toFixed(2) : 0,
      };

      return metrics;
    } catch (error) {
      throw new Error(
        `Error calculating technician performance: ${error.message}`
      );
    }
  },

  // Get service center performance metrics
  getServiceCenterPerformance: async (centerId, startDate, endDate) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(centerId)) {
        throw new Error("Invalid service center ID");
      }

      // First get all appointments for this center in the date range
      const appointmentQuery = {
        serviceCenterId: centerId,
        status: "completed",
      };

      if (startDate && endDate) {
        appointmentQuery.appointmentDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else if (startDate) {
        appointmentQuery.appointmentDate = { $gte: new Date(startDate) };
      } else if (endDate) {
        appointmentQuery.appointmentDate = { $lte: new Date(endDate) };
      }

      const appointments = await Appointment.find(appointmentQuery);
      const appointmentIds = appointments.map((a) => a._id);

      // Now get all progress records for these appointments
      const completedRecords = await WorkProgressTracking.find({
        appointmentId: { $in: appointmentIds },
        currentStatus: "completed",
      })
        .populate("technicianId", "firstName lastName")
        .populate("appointmentId");

      // Calculate performance metrics
      const totalJobs = completedRecords.length;
      let totalEfficiency = 0;
      let totalTimeSpent = 0;
      let totalQualityScore = 0;
      let jobsWithQualityScore = 0;
      let issueCount = 0;

      // Track technician performance
      const technicianPerformance = {};

      completedRecords.forEach((record) => {
        if (record.efficiency) {
          totalEfficiency += record.efficiency;
        }

        if (record.timeSpent) {
          totalTimeSpent += record.timeSpent;
        }

        if (record.qualityScore) {
          totalQualityScore += record.qualityScore;
          jobsWithQualityScore++;
        }

        if (record.issues && record.issues.length > 0) {
          issueCount += record.issues.length;
        }

        // Track individual technician metrics
        const techId = record.technicianId._id.toString();
        const techName = `${record.technicianId.firstName} ${record.technicianId.lastName}`;

        if (!technicianPerformance[techId]) {
          technicianPerformance[techId] = {
            technicianId: techId,
            technicianName: techName,
            jobsCompleted: 0,
            totalEfficiency: 0,
            totalTimeSpent: 0,
          };
        }

        technicianPerformance[techId].jobsCompleted++;

        if (record.efficiency) {
          technicianPerformance[techId].totalEfficiency += record.efficiency;
        }

        if (record.timeSpent) {
          technicianPerformance[techId].totalTimeSpent += record.timeSpent;
        }
      });

      // Calculate averages for each technician
      Object.values(technicianPerformance).forEach((tech) => {
        tech.averageEfficiency =
          tech.jobsCompleted > 0
            ? Math.round(tech.totalEfficiency / tech.jobsCompleted)
            : 0;

        tech.averageTimeSpentPerJob =
          tech.jobsCompleted > 0
            ? Math.round(tech.totalTimeSpent / tech.jobsCompleted)
            : 0;
      });

      const metrics = {
        centerId,
        totalJobsCompleted: totalJobs,
        averageEfficiency:
          totalJobs > 0 ? Math.round(totalEfficiency / totalJobs) : 0,
        averageTimeSpentPerJob:
          totalJobs > 0 ? Math.round(totalTimeSpent / totalJobs) : 0,
        averageQualityScore:
          jobsWithQualityScore > 0
            ? Math.round(totalQualityScore / jobsWithQualityScore)
            : 0,
        totalIssuesReported: issueCount,
        issuesPerJob: totalJobs > 0 ? (issueCount / totalJobs).toFixed(2) : 0,
        technicianPerformance: Object.values(technicianPerformance),
      };

      return metrics;
    } catch (error) {
      throw new Error(
        `Error calculating service center performance: ${error.message}`
      );
    }
  },

  // Assign additional technician to work progress
  addTechnicianToProgress: async (progressId, technicianData) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(progressId)) {
        throw new Error("Invalid progress record ID");
      }

      const progressRecord = await WorkProgressTracking.findById(progressId)
        .populate("appointmentId")
        .populate({
          path: "appointmentId",
          populate: {
            path: "serviceType",
            select: "serviceDetails.maxTechnicians name",
          },
        });

      if (!progressRecord) {
        throw new Error("Progress record not found");
      }

      // Check if technician exists
      const technician = await User.findById(technicianData.technicianId);
      if (!technician) {
        throw new Error("Technician not found");
      }

      // Check if already assigned
      const isAlreadyAssigned =
        progressRecord.technicians.some(
          (tech) =>
            tech.technicianId.toString() ===
            technicianData.technicianId.toString()
        ) ||
        progressRecord.technicianId.toString() ===
          technicianData.technicianId.toString();

      if (isAlreadyAssigned) {
        throw new Error("Technician is already assigned to this work progress");
      }

      // Check maximum technicians limit
      const currentTechCount = 1 + progressRecord.technicians.length; // +1 for primary technician
      const maxAllowed =
        progressRecord.appointmentId?.serviceType?.serviceDetails
          ?.maxTechnicians || 1;

      if (currentTechCount >= maxAllowed) {
        throw new Error(
          `Maximum ${maxAllowed} technicians allowed for service "${progressRecord.appointmentId?.serviceType?.name}"`
        );
      }

      // Add technician
      progressRecord.technicians.push({
        technicianId: technicianData.technicianId,
        role: technicianData.role || "assistant",
        assignedAt: new Date(),
        isActive: true,
      });

      await progressRecord.save();

      return await WorkProgressTracking.findById(progressId)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate(
          "technicians.technicianId",
          "firstName lastName email phoneNumber"
        )
        .populate("appointmentId")
        .populate("serviceRecordId");
    } catch (error) {
      throw new Error(`Error adding technician to progress: ${error.message}`);
    }
  },

  // Remove technician from work progress
  removeTechnicianFromProgress: async (progressId, technicianId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(progressId)) {
        throw new Error("Invalid progress record ID");
      }

      const progressRecord = await WorkProgressTracking.findById(progressId)
        .populate("appointmentId")
        .populate({
          path: "appointmentId",
          populate: {
            path: "serviceType",
            select: "serviceDetails.minTechnicians name",
          },
        });

      if (!progressRecord) {
        throw new Error("Progress record not found");
      }

      // Cannot remove primary technician
      if (progressRecord.technicianId.toString() === technicianId.toString()) {
        throw new Error(
          "Cannot remove primary technician. Reassign primary technician first."
        );
      }

      // Check minimum technicians requirement
      const currentTechCount =
        1 + progressRecord.technicians.filter((t) => t.isActive).length;
      const minRequired =
        progressRecord.appointmentId?.serviceType?.serviceDetails
          ?.minTechnicians || 1;

      if (currentTechCount - 1 < minRequired) {
        throw new Error(
          `Minimum ${minRequired} technicians required for service "${progressRecord.appointmentId?.serviceType?.name}"`
        );
      }

      // Remove technician
      progressRecord.technicians = progressRecord.technicians.filter(
        (tech) => tech.technicianId.toString() !== technicianId.toString()
      );

      await progressRecord.save();

      return await WorkProgressTracking.findById(progressId)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .populate(
          "technicians.technicianId",
          "firstName lastName email phoneNumber"
        )
        .populate("appointmentId")
        .populate("serviceRecordId");
    } catch (error) {
      throw new Error(
        `Error removing technician from progress: ${error.message}`
      );
    }
  },
};

export default workProgressTrackingService;
