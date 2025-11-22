const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validateCreatePatient } = require('../middlewares/validator.middleware');
const { requiredPateintOrClinicianRole } = require('../middlewares/rbac.middleware');

router
    .post('/',
        authenticate,
        requiredPateintOrClinicianRole,
        validateCreatePatient,
        patientController.createPatient);

module.exports = router;
