const { Patient, PATIENT_STATUS } = require('../models/Patient');
const logger = require('../utils/logger');
const { ValidationError, ConflictError, NotFoundError } = require('../utils/errors');
const PatientReadView = require('../models/PatientReadView');
const { publishEvent, EVENT_TYPES } = require('../utils/eventProducer');

/***
 * Create a new patient record.
 * @param {Object} patientData - Data for the new patient.
 * @returns {Object} Created Patient object.
 */
const createPatient = async (patientData) => {
    const { userId, email } = patientData;
    // Check if patient already exists with userId
    if (userId) {
        const existingByUserId = await Patient.findByUserId(userId);
        if (existingByUserId) {
            throw new ConflictError('Patient with this userId already exists');
        }
    }

    // Check if patient already exists with email
    if (email) {
        const existingByEmail = await Patient.findByEmail(email);
        if (existingByEmail) {
            throw new ConflictError('Patient with this email already exists');
        }
    }

    // Create new patient object with status ACTIVE
    const patient = new Patient({
        ...patientData,
        email: email ? email.toLowerCase() : undefined,
        status: PATIENT_STATUS.ACTIVE,
    });

    // Save patient to database
    await patient.save();
    logger.info(`Patient created: ${patient._id} (${patient.email})`);

    // Update read view (CQRS)
    await PatientReadView.updateFromPatient(patient);

    // Publish PATIENT_CREATED event
    await publishEvent(EVENT_TYPES.PATIENT_CREATED, {
        patientId: patient._id.toString(),
        userId: patient.userId,
        email: patient.email,
        firstName: patient.firstName,
        lastName: patient.lastName
    })

    // return created patient
    return patient;
}

/**
 * Get Patient By Id
 * @param {String} patientId - The ID of the patient to retrieve.
 * @returns {Object|null} Patient object if found, otherwise null.
 */
const getPatientById = async (patientId) => {
    const patient = await Patient.findById(patientId);
    if (!patient) {
        throw new NotFoundError('Patient not found');
    }

    return patient;
}

/**
 * Get Patients By User Id
 * @param {String} userId - User Id from the auth service
 * @returns {Object} Patient Object
 */
const getPatientByUserId = async (userId) => {
    const patient = await Patient.findByUserId(userId);
    if (!patient) {
        throw new NotFoundError('Patient not found');
    }

    return patient;
}

/**
 * Get Patient By email
 * @param {String} email - The email of the patient to retrieve.
 * @returns {Object|null} Patient object if found, otherwise null.
 */
const getPatientByEmail = async (email) => {
    const patient = await Patient.findByEmail(email.toLowerCase());
    if (!patient) {
        throw new NotFoundError('Patient not found');
    }

    return patient;
}


/**
 * Get All Patients with Pagination and filters
 * @param {Object} filters - filter options
 * @param {Number} page - page number
 * @param {Number} limit - number of records per page
 * @returns {Object} paginated list of patients
 */
const getAllPatients = async (filters = {}, page = 1, limit = 10, useReadView = true) => {
    const query = {};

    // Apply filters
    if (filters.status) {
        query.status = filters.status;
    }

    if (filters.city) {
        query.city = new RegExp(filters.city, 'i'); // case insensitive
    }

    if (filters.search) {
        // use text search on read for better performance
        //query.$text = { $search: filters.search };

        // simple or condition on name and email fields
        query.$or = [
            { firstName: new RegExp(filters.search, 'i') },
            { lastName: new RegExp(filters.search, 'i') },
            { email: new RegExp(filters.search, 'i') },
        ];
    }

    const skip = (page - 1) * limit;

    // Use read-optimized view for fetching patients (CQRS)
    if (useReadView) {
        const [patients, total] = await Promise.all([
            PatientReadView.find(query)
                .sort({ registrationDate: -1 })
                .skip(skip)
                .limit(limit),
            PatientReadView.countDocuments(query)
        ])

        // fetch full patient data if needed (can be optimized further if required)
        const patientIds = patients.map(p => p.patientId);
        const fullPatients = await Patient.find({ _id: { $in: patientIds } });

        return {
            patients: fullPatients,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        }
    }

    // fallback to write model if read view not avaliable
    const [patients, total] = await Promise.all([
        Patient.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Patient.countDocuments(query)
    ]);

    return {
        patients,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    };
}

/**
 * Update Patient Details
 * @param {String} patientId - ID of the patient to update
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated Patient object
 */
const updatePatient = async (patientId, updateDate) => {
    const patient = await Patient.findById(patientId);

    if (!patient) {
        throw new NotFoundError('Patient not found');
    }

    // handle email update separately to check for conflicts
    if (updateDate.email && updateDate.email !== patient.email) {
        const existingByEmail = await Patient.findByEmail(updateDate.email);
        if (existingByEmail && existingByEmail._id.toString() !== patientId) {
            throw new ConflictError('Another patient with this email already exists');
        }
        updateDate.email = updateDate.email.toLowerCase();
    }

    Object.assign(patient, updateDate);
    await patient.save();

    logger.info(`Patient updated: ${patient._id} (${patient.email})`);

    // Update read view (CQRS)
    await PatientReadView.updateFromPatient(patient);

    // Publish PATIENT_UPDATED event
    await publishEvent(EVENT_TYPES.PATIENT_UPDATED, {
        patientId: patient._id.toString(),
        userId: patient.userId,
        email: patient.email,
        updatedFields: Object.keys(updateDate)
    });

    return patient;

}

/***
 * Delete patient (sft delete by setting status to INACTIVE)
 * @param {String} patientId - ID of the patient to delete
 */
const deletePatient = async (patientId) => {
    const patient = await Patient.findById(patientId);

    if (!patient) {
        throw new NotFoundError('Patient not found');
    }

    patient.status = PATIENT_STATUS.INACTIVE;
    await patient.save();

    logger.info(`Patient deleted (inactivated): ${patient._id} (${patient.email})`);

    // Update read view (CQRS)
    await PatientReadView.updateFromPatient(patient);

    // Publish PATIENT_DELETED event
    await publishEvent(EVENT_TYPES.PATIENT_DELETED, {
        patientId: patient._id.toString(),
        userId: patient.userId,
        email: patient.email
    });

}

/**
 * Add midical history item
 * @param {String} patientId - ID of the patient
 * @param {Object} historyItem - Medical history item to add
 * @return {Object} Updated Patient object
 */
const addMedicalHistory = async (patientId, historyItem) => {
    const patient = await Patient.findById(patientId);

    if (!patient) {
        throw new NotFoundError('Patient not found');
    }

    await Patient.addMedicalHistory(historyItem);
    await patient.save();
    logger.info(`Medical history added for patient: ${patient._id})`);

    // Update read view (CQRS)
    await PatientReadView.updateFromPatient(patient);

    // Publish MEDICAL_HISTORY_ADDED event
    await publishEvent(EVENT_TYPES.MEDICAL_HISTRORY_ADDED, {
        patientId: patient._id.toString(),
        condition: historyItem.condition,
        status: historyItem.status
    });

    return patient;
}

/**
 * Add allergy item
 * @param {String} patientId - ID of the patient
 * @param {Object} allergyItem - Allergy item to add
 * @return {Object} Updated Patient object
 */
const addAllergy = async (patientId, allergyItem) => {
    const patient = await Patient.findById(patientId);

    if (!patient) {
        throw new NotFoundError('Patient not found');
    }

    await Patient.addAllergy(allergyItem);
    await patient.save();
    logger.info(`Allergy added for patient: ${patient._id})`);

    // Update read view (CQRS)
    await PatientReadView.updateFromPatient(patient);

    // Publish event ALLERGY_ADDED
    await publishEvent(EVENT_TYPES.ALLERGY_ADDED, {
        patientId: patient._id.toString(),
        allergen: allergyItem.allergen,
        severity: allergyItem.severity
    });

    return patient;
}

/**
 * Add medication item
 * @param {String} patientId - ID of the patient
 * @param {Object} medicationItem - Medication item to add
 * @return {Object} Updated Patient object
 */
const addMedication = async (patientId, medicationItem) => {
    const patient = await Patient.findById(patientId);

    if (!patient) {
        throw new NotFoundError('Patient not found');
    }

    await Patient.addMedication(medicationItem);
    await patient.save();
    logger.info(`Medication added for patient: ${patient._id})`);

    // Update read view (CQRS)
    await PatientReadView.updateFromPatient(patient);

    // Publish MEDICATION_ADDED event
    await publishEvent(EVENT_TYPES.MEDICATION_ADDED, {
        patientId: patient._id.toString(),
        medicationName: medicationItem.name,
        dosage: medicationItem.dosage
    });
    return patient;
}

/**
 * Update last visit date
 * @param {String} patientId - ID of the patient
 * @returns {Object} Updated Patient object
 */
const updateLastVisit = async (patientId) => {
    const patient = await Patient.findById(patientId);
    if (!patient) {
        throw new NotFoundError('Patient not found');
    }

    patient.lastVisitDate = new Date();
    await patient.save();

    logger.info(`Last visit date updated for patient: ${patient._id})`);

    // Update read view (CQRS)
    await PatientReadView.updateFromPatient(patient);
    return patient;
}



module.exports = {
    createPatient,
    getPatientById,
    getPatientByUserId,
    getPatientByEmail,
    getAllPatients,
    updatePatient,
    deletePatient,
    addMedicalHistory,
    addAllergy,
    addMedication,
    updateLastVisit
}