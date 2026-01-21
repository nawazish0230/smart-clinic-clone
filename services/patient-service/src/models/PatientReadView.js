
const mongoose = require('mongoose');

/***
 * Read-optimized view of patient data for CQRS.
 * This is a denormalized, indexed collection optiomized for read operations.
 * Update vie events from the write model (Patient).
 */
const patientReadViewSchema = new mongoose.Schema({
    // Link to write model
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: String,
        index: true
    },

    // Denomalized data for fast read
    fullName: {
        type: String,
        index: true
    },
    firstName: {
        type: String,
        index: true
    },
    lastName: {
        type: String,
        index: true
    },
    email: {
        type: String,
        index: true
    },
    phone: {
        type: String
    },

    // Computed fields
    age: Number,
    dateOfBirth: Date,
    gender: String,
    bloodType: String,

    // Address (denomalized for search)
    city: {
        type: String,
        index: true
    },
    state: {
        type: String,
        index: true
    },
    zipCode: String,
    fullAddress: String, // for full-text search

    // Medical summary (denomalized)
    medicalHistoryCount: {
        type: Number,
        default: 0
    },
    allergiesCount: {
        type: Number,
        default: 0
    },
    medicationsCount: {
        type: Number,
        default: 0
    },
    hasActiveCondition: {
        type: Boolean,
        index: true
    },
    // status
    status: {
        type: String,
        index: true
    },
    // Timestamps
    registrationDate: Date,
    lastVisitDate: Date,
    lastUpdated: Date,

    // searchable text (for full-text search)
    searchText: {
        type: String,
        index: 'text'
    }
}, {
    timestamps: false,  // we manage timestamps manually
});

// Compound indexes for common queries
patientReadViewSchema.index({ status: 1, city: 1 });
patientReadViewSchema.index({ lastName: 1, firstName: 1 });
patientReadViewSchema.index({ registrationDate: -1 });
patientReadViewSchema.index({ lastVisitDate: -1 });
patientReadViewSchema.index({ hasActiveCondition: 1, city: 1 });

// text search index
patientReadViewSchema.index({ searchText: 'text' })

/**
 * update read view from patient document
 * @param {Object} patient - patient document from write model
 */
patientReadViewSchema.statics.updateFromPatient = async function (patient) {
    const readViewData = {
        patientId: patient._id,
        userId: patient.userId,
        fullName: `${patient.firstName} ${patient.lastName}`,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        age: patient.age,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodType: patient.bloodType,
        city: patient.address?.city,
        state: patient.address?.state,
        zipCode: patient.address?.zipCode,
        fullAddress: patient.address ? `${patient.address.street || ''}, ${patient.address.city || ''}, ${patient.address.state || ''} ${patient.address.zipCode || ''}`.trim() : '',
        medicalHistoryCount: patient.medicalHistory?.length || 0,
        allergiesCount: patient.allergies?.length || 0,
        medicationsCount: patient.currentMedications?.length || 0,
        hasActiveCondition: patient.medicalHistroty?.some(h => h.status === 'active' || h.status === 'chronic') || false,
        status: patient.status,
        registrationDate: patient.registrationDate,
        lastVisitDate: patient.lastVisitDate,
        lastUpdated: new Date(),
        searchText: [
            patient.firstName,
            patient.lastName,
            patient.email,
            patient.phone,
            patient.address?.city,
            patient.address?.state,
        ].filter(Boolean).join(' ')
    };

    await this.findOneAndUpdate(
        { patientId: patient._id },
        readViewData,
        { upsert: true, new: true }
    );
}

/**
 * Delete read view
 */
patientReadViewSchema.statics.deleteByPatientId = async function (patientId) {
    await this.deleteOne({ patientId});
};

const PatientReadView = mongoose.model('PatientReadView', patientReadViewSchema);

module.exports = PatientReadView;               