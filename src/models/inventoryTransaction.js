const mongoose = require('mongoose');

const InventoryTransactionSchema = new mongoose.Schema({
    inventoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'CenterInventory',
        required: true
    },
    transactionType: {
        type: String,
        enum: ['in', 'out', 'adjustment', 'transfer'],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitCost: {
        type: Number,
        min: 0
    },
    referenceType: {
        type: String,
        enum: ['service', 'purchase', 'adjustment', 'transfer'],
        required: true
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'referenceType' // động, tham chiếu tùy loại (vd: ServiceRecord, PurchaseOrder...)
    },
    notes: {
        type: String
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // nhân viên thực hiện
        required: true
    },
    transactionDate: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: false, updatedAt: false }
});

module.exports = mongoose.model('InventoryTransaction', InventoryTransactionSchema);
