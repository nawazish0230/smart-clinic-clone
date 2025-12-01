const patientService = require('../services/patient.service');
const { ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

/**
 * Create a new patient record.
 */
const createPatient = async (req, res, next) => {
    try {
        const patientData = req.body;
        // if userId not provided and user os authenticated, use authenticated user's id
        if (!patientData.userId && req.user) {
            patientData.userId = req.user.userId;
        }

        const patient = await patientService.createPatient(patientData);

        res.status(201).json({
            success: true,
            message: 'Patient record created successfully',
            data: patient
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get Patient by Id
 */
const getPatientById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const patient = await patientService.getPatientById(id);

        res.status(200).json({
            success: true,
            data: patient
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get Patients By User Id
 */
const getPatientByUserId = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const patient = await patientService.getPatientByUserId(userId);
        res.status(200).json({
            success: true,
            data: patient
        });
    } catch (error) {
        next(error);
    }
}

/**
 * Get current User's Patient profile
 */


/**
 * Get All patients with pagination
 */
const getAllPatients = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        const filters = {
            status: req.query.status,
            city: req.query.city,
            search: req.query.search
        }

        const result = await patientService.getAllPatients(filters, page, limit);

        res.status(200).json({
            success: true,
            data: result

        });
    } catch (error) {
        next(error);
    }
}

/**
 * Update Patient record
 */


/**
 * Delete Patient record
 */


/**
 * Add medical history item to Patient
 */


/**
 * Add allergy to Patient
 */


/**
 * Add medication to Patient
 */


module.exports = {
    createPatient,
    getPatientById,
    getPatientByUserId,
    getAllPatients
}