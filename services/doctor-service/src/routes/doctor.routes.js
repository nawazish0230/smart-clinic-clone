const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctor.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { requireDoctorOrAdmin, requireClinician } = require('../middleware/rbac.middleware');
const {
  validateCreateDoctor,
  validateUpdateDoctor,
  validateGetDoctors,
  validateAvailabilitySlot,
} = require('../middleware/validator.middleware');

/**
 * @swagger
 * /api/doctors:
 *   post:
 *     summary: Create a new doctor
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: "Dr. Sarah"
 *               lastName:
 *                 type: string
 *                 example: "Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "sarah.smith@smartclinic.com"
 *               specializations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["cardiology", "internal medicine"]
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, requireClinician, validateCreateDoctor, doctorController.createDoctor);

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Get all doctors with pagination
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *       - in: query
 *         name: availableDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of doctors
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, validateGetDoctors, doctorController.getAllDoctors);

/**
 * @swagger
 * /api/doctors/me:
 *   get:
 *     summary: Get current user's doctor profile
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doctor profile
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Doctor not found
 */
router.get('/me', authenticate, doctorController.getMyProfile);

/**
 * @swagger
 * /api/doctors/available:
 *   get:
 *     summary: Get available doctors for date/time
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: startTime
 *         schema:
 *           type: string
 *           format: time
 *       - in: query
 *         name: endTime
 *         schema:
 *           type: string
 *           format: time
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Available doctors
 */
router.get('/available', authenticate, doctorController.getAvailableDoctors);

/**
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     summary: Get doctor by ID
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor details
 *       404:
 *         description: Doctor not found
 */
router.get('/:id', authenticate, doctorController.getDoctorById);

/**
 * @swagger
 * /api/doctors/user/{userId}:
 *   get:
 *     summary: Get doctor by user ID
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor details
 *       404:
 *         description: Doctor not found
 */
router.get('/user/:userId', authenticate, requireClinician, doctorController.getDoctorByUserId);

/**
 * @swagger
 * /api/doctors/{id}:
 *   put:
 *     summary: Update doctor
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       404:
 *         description: Doctor not found
 */
router.put('/:id', authenticate, requireDoctorOrAdmin, validateUpdateDoctor, doctorController.updateDoctor);

/**
 * @swagger
 * /api/doctors/{id}:
 *   delete:
 *     summary: Delete doctor (soft delete)
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor deleted successfully
 *       404:
 *         description: Doctor not found
 */
router.delete('/:id', authenticate, requireClinician, doctorController.deleteDoctor);

/**
 * @swagger
 * /api/doctors/{id}/specializations:
 *   post:
 *     summary: Add specialization
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - specialization
 *             properties:
 *               specialization:
 *                 type: string
 *     responses:
 *       200:
 *         description: Specialization added successfully
 */
router.post('/:id/specializations', authenticate, requireDoctorOrAdmin, doctorController.addSpecialization);

/**
 * @swagger
 * /api/doctors/{id}/specializations:
 *   delete:
 *     summary: Remove specialization
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - specialization
 *             properties:
 *               specialization:
 *                 type: string
 *     responses:
 *       200:
 *         description: Specialization removed successfully
 */
router.delete('/:id/specializations', authenticate, requireDoctorOrAdmin, doctorController.removeSpecialization);

/**
 * @swagger
 * /api/doctors/{id}/availability:
 *   post:
 *     summary: Add availability slot
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - startTime
 *               - endTime
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *                 format: time
 *               endTime:
 *                 type: string
 *                 format: time
 *     responses:
 *       200:
 *         description: Availability slot added successfully
 */
router.post('/:id/availability', authenticate, requireDoctorOrAdmin, validateAvailabilitySlot, doctorController.addAvailabilitySlot);

/**
 * @swagger
 * /api/doctors/{id}/availability/{slotId}:
 *   patch:
 *     summary: Update slot status
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: slotId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [available, booked, blocked, unavailable]
 *               appointmentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Slot status updated successfully
 */
router.patch('/:id/availability/:slotId', authenticate, requireDoctorOrAdmin, doctorController.updateSlotStatus);

/**
 * @swagger
 * /api/doctors/{id}/schedule:
 *   put:
 *     summary: Update weekly schedule
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - weeklySchedule
 *             properties:
 *               weeklySchedule:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Weekly schedule updated successfully
 */
router.put('/:id/schedule', authenticate, requireDoctorOrAdmin, doctorController.updateWeeklySchedule);

/**
 * @swagger
 * /api/doctors/{id}/unavailable:
 *   post:
 *     summary: Set doctor unavailable
 *     tags: [Doctor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Doctor set to unavailable
 */
router.post('/:id/unavailable', authenticate, requireDoctorOrAdmin, doctorController.setDoctorUnavailable);

module.exports = router;

