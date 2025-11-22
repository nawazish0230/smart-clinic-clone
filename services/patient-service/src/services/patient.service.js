const {Patient, PATIENT_STATUS} = require('../models/Patient');
const logger = require('../utils/logger');
const { ValidationError, ConflictError, NotFoundError} = require('../utils/errors');

/***
 * Create a new patient record.
 * @param {Object} patientData - Data for the new patient.
 * @returns {Object} Created Patient object.
 */
const createPatient = async (patientData) => {
    const {userId, email} = patientData;
    // Check if patient already exists with userId
    if(userId){
        const existingByUserId = await Patient.findByUserId(userId);
        if(existingByUserId){
            throw new ConflictError('Patient with this userId already exists');
        }
    }

    // Check if patient already exists with email
    if(email){
        const existingByEmail = await Patient.findByEmail(email);
        if(existingByEmail){
            throw new ConflictError('Patient with this email already exists');
        }
    }
    
    // Create new patient object with status ACTIVE
    const patient = new Patient({
        ...patientData,
        email: email ? email.toLowerCase(): undefined,
        status: PATIENT_STATUS.ACTIVE,
    });

    // Save patient to database
    await patient.save();
    logger.info(`Patient created: ${patient._id} (${patient.email})`);

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
    if(!patient){
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
    if(!patient){
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
    if(!patient){
        throw new NotFoundError('Patient not found');
    }

    return patient;
}

/**
 * Get All Patients with Pagination and filters
 */