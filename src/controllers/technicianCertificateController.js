import technicianCertificateService from "../services/technicianCertificateService.js";

const technicianCertificateController = {
  // Get all certificates
  getAllCertificates: async (req, res) => {
    try {
      const { technicianId, specialization, status } = req.query;
      const filters = {};

      if (technicianId) filters.technicianId = technicianId;
      if (specialization) filters.specialization = specialization;
      if (status) filters.status = status;

      const certificates = await technicianCertificateService.getAllCertificates(
        filters
      );

      res.status(200).json({
        success: true,
        data: certificates,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch certificates",
      });
    }
  },

  // Get certificate by ID
  getCertificateById: async (req, res) => {
    try {
      const { id } = req.params;
      const certificate = await technicianCertificateService.getCertificateById(
        id
      );

      if (!certificate) {
        return res.status(404).json({
          success: false,
          message: "Certificate not found",
        });
      }

      res.status(200).json({
        success: true,
        data: certificate,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch certificate",
      });
    }
  },

  // Create new certificate
  createCertificate: async (req, res) => {
    try {
      const {
        technicianId,
        certificateName,
        issuingAuthority,
        issueDate,
        expiryDate,
        certificateNumber,
        specialization,
        status,
        documentUrl,
      } = req.body;

      // Validate required fields
      if (!technicianId || !certificateName || !issueDate) {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }

      const newCertificate = await technicianCertificateService.createCertificate({
        technicianId,
        certificateName,
        issuingAuthority,
        issueDate,
        expiryDate,
        certificateNumber,
        specialization,
        status,
        documentUrl,
      });

      res.status(201).json({
        success: true,
        data: newCertificate,
        message: "Certificate created successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to create certificate",
      });
    }
  },

  // Update certificate
  updateCertificate: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        certificateName,
        issuingAuthority,
        issueDate,
        expiryDate,
        certificateNumber,
        specialization,
        status,
        documentUrl,
      } = req.body;

      const updatedCertificate = await technicianCertificateService.updateCertificate(
        id,
        {
          certificateName,
          issuingAuthority,
          issueDate,
          expiryDate,
          certificateNumber,
          specialization,
          status,
          documentUrl,
        }
      );

      if (!updatedCertificate) {
        return res.status(404).json({
          success: false,
          message: "Certificate not found",
        });
      }

      res.status(200).json({
        success: true,
        data: updatedCertificate,
        message: "Certificate updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update certificate",
      });
    }
  },

  // Delete certificate
  deleteCertificate: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await technicianCertificateService.deleteCertificate(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: "Certificate not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Certificate deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to delete certificate",
      });
    }
  },

  // Get certificates by technician
  getCertificatesByTechnician: async (req, res) => {
    try {
      const { technicianId } = req.params;
      const certificates = await technicianCertificateService.getCertificatesByTechnician(
        technicianId
      );

      res.status(200).json({
        success: true,
        data: certificates,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch certificates by technician",
      });
    }
  },

  // Get certificates by specialization
  getCertificatesBySpecialization: async (req, res) => {
    try {
      const { specialization } = req.params;
      const certificates = await technicianCertificateService.getCertificatesBySpecialization(
        specialization
      );

      res.status(200).json({
        success: true,
        data: certificates,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error.message || "Failed to fetch certificates by specialization",
      });
    }
  },

  // Update certificate status
  updateCertificateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: "Status is required",
        });
      }

      const updatedCertificate = await technicianCertificateService.updateCertificateStatus(
        id,
        status
      );

      if (!updatedCertificate) {
        return res.status(404).json({
          success: false,
          message: "Certificate not found",
        });
      }

      res.status(200).json({
        success: true,
        data: updatedCertificate,
        message: "Certificate status updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to update certificate status",
      });
    }
  },

  // Check for expired certificates
  checkExpiredCertificates: async (req, res) => {
    try {
      const expiredCertificates = await technicianCertificateService.checkExpiredCertificates();

      res.status(200).json({
        success: true,
        data: expiredCertificates,
        message: `${expiredCertificates.length} certificates marked as expired`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to check expired certificates",
      });
    }
  },

  // Get soon-to-expire certificates
  getSoonToExpireCertificates: async (req, res) => {
    try {
      const { days } = req.query;
      const daysNumber = days ? parseInt(days) : 30;

      const certificates = await technicianCertificateService.getSoonToExpireCertificates(
        daysNumber
      );

      res.status(200).json({
        success: true,
        data: certificates,
        message: `Found ${certificates.length} certificates expiring in the next ${daysNumber} days`,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch soon-to-expire certificates",
      });
    }
  },
};

export default technicianCertificateController;
