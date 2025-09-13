import mongoose from "mongoose";
import TechnicianCertificate from "../models/technicianCertificate.js";
import User from "../models/user.js";

const technicianCertificateService = {
  // Get all certificates with optional filtering
  getAllCertificates: async (filters = {}) => {
    try {
      return await TechnicianCertificate.find(filters)
        .populate("technicianId", "firstName lastName email phoneNumber")
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error fetching certificates: ${error.message}`);
    }
  },

  // Get certificate by ID
  getCertificateById: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid certificate ID");
      }

      return await TechnicianCertificate.findById(id).populate(
        "technicianId",
        "firstName lastName email phoneNumber"
      );
    } catch (error) {
      throw new Error(`Error fetching certificate: ${error.message}`);
    }
  },

  // Create new certificate
  createCertificate: async (certificateData) => {
    try {
      // Check if technician exists
      const technicianExists = await User.findById(
        certificateData.technicianId
      );
      if (!technicianExists) {
        throw new Error("Technician not found");
      }

      // Validate expiry date if provided
      if (
        certificateData.expiryDate &&
        new Date(certificateData.expiryDate) <=
          new Date(certificateData.issueDate)
      ) {
        throw new Error("Expiry date must be after issue date");
      }

      // Create new certificate
      const newCertificate = new TechnicianCertificate(certificateData);
      await newCertificate.save();

      return await TechnicianCertificate.findById(newCertificate._id).populate(
        "technicianId",
        "firstName lastName email phoneNumber"
      );
    } catch (error) {
      throw new Error(`Error creating certificate: ${error.message}`);
    }
  },

  // Update certificate
  updateCertificate: async (id, updateData) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid certificate ID");
      }

      // Validate expiry date if provided
      if (updateData.expiryDate && updateData.issueDate) {
        if (new Date(updateData.expiryDate) <= new Date(updateData.issueDate)) {
          throw new Error("Expiry date must be after issue date");
        }
      } else if (updateData.expiryDate) {
        const certificate = await TechnicianCertificate.findById(id);
        if (
          certificate &&
          new Date(updateData.expiryDate) <= new Date(certificate.issueDate)
        ) {
          throw new Error("Expiry date must be after issue date");
        }
      }

      const certificate = await TechnicianCertificate.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate("technicianId", "firstName lastName email phoneNumber");

      return certificate;
    } catch (error) {
      throw new Error(`Error updating certificate: ${error.message}`);
    }
  },

  // Delete certificate
  deleteCertificate: async (id) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid certificate ID");
      }

      const certificate = await TechnicianCertificate.findByIdAndDelete(id);
      return certificate;
    } catch (error) {
      throw new Error(`Error deleting certificate: ${error.message}`);
    }
  },

  // Get certificates by technician
  getCertificatesByTechnician: async (technicianId) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(technicianId)) {
        throw new Error("Invalid technician ID");
      }

      return await TechnicianCertificate.find({ technicianId }).sort({
        createdAt: -1,
      });
    } catch (error) {
      throw new Error(
        `Error fetching certificates by technician: ${error.message}`
      );
    }
  },

  // Get certificates by specialization
  getCertificatesBySpecialization: async (specialization) => {
    try {
      return await TechnicianCertificate.find({ specialization })
        .populate("technicianId", "firstName lastName email phoneNumber")
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(
        `Error fetching certificates by specialization: ${error.message}`
      );
    }
  },

  // Update certificate status
  updateCertificateStatus: async (id, status) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("Invalid certificate ID");
      }

      // Validate status
      const validStatuses = ["active", "expired", "revoked"];
      if (!validStatuses.includes(status)) {
        throw new Error(
          "Invalid status. Must be one of: active, expired, revoked"
        );
      }

      const certificate = await TechnicianCertificate.findByIdAndUpdate(
        id,
        { $set: { status } },
        { new: true, runValidators: true }
      ).populate("technicianId", "firstName lastName email phoneNumber");

      return certificate;
    } catch (error) {
      throw new Error(`Error updating certificate status: ${error.message}`);
    }
  },

  // Check for expired certificates
  checkExpiredCertificates: async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const expiredCertificates = await TechnicianCertificate.find({
        expiryDate: { $lt: today },
        status: "active",
      }).populate("technicianId", "firstName lastName email phoneNumber");

      // Update status to expired
      for (const cert of expiredCertificates) {
        cert.status = "expired";
        await cert.save();
      }

      return expiredCertificates;
    } catch (error) {
      throw new Error(`Error checking expired certificates: ${error.message}`);
    }
  },

  // Get soon-to-expire certificates (within days)
  getSoonToExpireCertificates: async (days = 30) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);
      futureDate.setHours(23, 59, 59, 999);

      return await TechnicianCertificate.find({
        expiryDate: { $gte: today, $lte: futureDate },
        status: "active",
      })
        .populate("technicianId", "firstName lastName email phoneNumber")
        .sort({ expiryDate: 1 });
    } catch (error) {
      throw new Error(
        `Error fetching soon-to-expire certificates: ${error.message}`
      );
    }
  },
};

export default technicianCertificateService;
