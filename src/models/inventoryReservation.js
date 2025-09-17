import mongoose from "mongoose";

const InventoryReservationSchema = new mongoose.Schema(
    {
        appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
        serviceCenterId: { type: mongoose.Schema.Types.ObjectId, ref: "ServiceCenter", required: true },
        items: [
            {
                partId: { type: mongoose.Schema.Types.ObjectId, ref: "Part", required: true },
                quantity: { type: Number, required: true, min: 1 },
            },
        ],
        status: { type: String, enum: ["held", "released", "consumed"], default: "held" },
        expiresAt: { type: Date },
        notes: { type: String },
    },
    { timestamps: true }
);

InventoryReservationSchema.index({ appointmentId: 1 });
InventoryReservationSchema.index({ serviceCenterId: 1 });
InventoryReservationSchema.index({ status: 1 });
InventoryReservationSchema.index({ expiresAt: 1 });

const InventoryReservation = mongoose.model("InventoryReservation", InventoryReservationSchema);

export default InventoryReservation;


