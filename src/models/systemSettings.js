import mongoose from "mongoose";

const SystemSettingsSchema = new mongoose.Schema(
    {
        depositRate: { type: Number, default: 0 }, // 0..1
        inspectionFee: { type: Number, default: 0 }, // VND
        cancellationWindowHours: { type: Number, default: 24 },
        autoCancelUnpaidMinutes: { type: Number, default: 30 },
        currency: { type: String, default: "VND" },
    },
    { timestamps: true }
);

// Singleton pattern: always use the first document
SystemSettingsSchema.statics.getSettings = async function () {
    let doc = await this.findOne();
    if (!doc) doc = await this.create({});
    return doc;
};

const SystemSettings = mongoose.model("SystemSettings", SystemSettingsSchema);

export default SystemSettings;


