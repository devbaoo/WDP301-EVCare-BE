import mongoose from 'mongoose';

const VehicleModelSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: true,
        maxlength: 50
    },
    modelName: {
        type: String,
        required: true,
        maxlength: 100
    },
    yearFrom: {
        type: Number,
        required: true
    },
    yearTo: {
        type: Number
    },
    batteryType: {
        type: String,
        maxlength: 50
    },
    batteryCapacity: {
        type: Number, // kWh
        min: 0
    },
    motorPower: {
        type: Number, // kW
        min: 0
    },
    maintenanceIntervals: {
        type: mongoose.Schema.Types.Mixed, // JSON dạng { "10000km": "check battery", "12months": "replace coolant" }
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

const VehicleModel = mongoose.model('VehicleModel', VehicleModelSchema);

export default VehicleModel;
