const { ApolloError, AuthenticationError, ForbiddenError } = require('apollo-server-express');
const doctorService = require('../services/doctor.service');

// Date scalar resolver
const DateScalar = {
  Date: {
    parseValue(value) {
      return new Date(value);
    },
    serialize(value) {
      return value instanceof Date ? value.toISOString() : null;
    },
    parseLiteral(ast) {
      return new Date(ast.value);
    },
  },
};

const resolvers = {
  ...DateScalar,

  Query: {
    doctor: async (parent, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      return await doctorService.getDoctorById(id);
    },

    doctorByUserId: async (parent, { userId }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      // Only clinicians can query by userId
      if (!user.roles || !user.roles.some(r => ['doctor', 'clinician', 'admin'].includes(r))) {
        throw new ForbiddenError('Access denied');
      }
      return await doctorService.getDoctorByUserId(userId);
    },

    me: async (parent, args, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      return await doctorService.getDoctorByUserId(user.userId);
    },

    doctors: async (parent, { page, limit, filters }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      const useReadView = !!(filters?.availableDate || filters?.availableTime);
      return await doctorService.getAllDoctors(filters || {}, page, limit, useReadView);
    },

    availableDoctors: async (parent, { date, startTime, endTime, specialization }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      return await doctorService.getAvailableDoctors(date, startTime, endTime, specialization);
    },
  },

  Mutation: {
    createDoctor: async (parent, { input }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      // Only clinicians can create doctors
      if (!user.roles || !user.roles.some(r => ['doctor', 'clinician', 'admin'].includes(r))) {
        throw new ForbiddenError('Access denied');
      }
      
      // If userId not provided, use authenticated user's ID
      if (!input.userId && user.userId) {
        input.userId = user.userId;
      }

      return await doctorService.createDoctor(input);
    },

    updateDoctor: async (parent, { id, input }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      // Doctors can only update their own profile
      const doctor = await doctorService.getDoctorById(id);
      if (doctor.userId !== user.userId && !user.roles?.some(r => ['admin'].includes(r))) {
        throw new ForbiddenError('Access denied');
      }

      return await doctorService.updateDoctor(id, input);
    },

    deleteDoctor: async (parent, { id }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      // Only clinicians can delete doctors
      if (!user.roles || !user.roles.some(r => ['doctor', 'clinician', 'admin'].includes(r))) {
        throw new ForbiddenError('Access denied');
      }

      await doctorService.deleteDoctor(id);
      return true;
    },

    addSpecialization: async (parent, { id, specialization }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      // Doctors can only update their own profile
      const doctor = await doctorService.getDoctorById(id);
      if (doctor.userId !== user.userId && !user.roles?.some(r => ['admin'].includes(r))) {
        throw new ForbiddenError('Access denied');
      }

      return await doctorService.addSpecialization(id, specialization);
    },

    removeSpecialization: async (parent, { id, specialization }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      // Doctors can only update their own profile
      const doctor = await doctorService.getDoctorById(id);
      if (doctor.userId !== user.userId && !user.roles?.some(r => ['admin'].includes(r))) {
        throw new ForbiddenError('Access denied');
      }

      return await doctorService.removeSpecialization(id, specialization);
    },

    addAvailabilitySlot: async (parent, { id, slot }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      // Doctors can only update their own schedule
      const doctor = await doctorService.getDoctorById(id);
      if (doctor.userId !== user.userId && !user.roles?.some(r => ['admin'].includes(r))) {
        throw new ForbiddenError('Access denied');
      }

      return await doctorService.addAvailabilitySlot(id, slot);
    },

    updateSlotStatus: async (parent, { id, slotId, status, appointmentId }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      // Doctors can only update their own schedule
      const doctor = await doctorService.getDoctorById(id);
      if (doctor.userId !== user.userId && !user.roles?.some(r => ['admin'].includes(r))) {
        throw new ForbiddenError('Access denied');
      }

      return await doctorService.updateSlotStatus(id, slotId, status, appointmentId);
    },

    updateWeeklySchedule: async (parent, { id, weeklySchedule }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      // Doctors can only update their own schedule
      const doctor = await doctorService.getDoctorById(id);
      if (doctor.userId !== user.userId && !user.roles?.some(r => ['admin'].includes(r))) {
        throw new ForbiddenError('Access denied');
      }

      return await doctorService.updateWeeklySchedule(id, weeklySchedule);
    },

    setDoctorUnavailable: async (parent, { id, reason }, { user }) => {
      if (!user) throw new AuthenticationError('Authentication required');
      
      // Doctors can only update their own status
      const doctor = await doctorService.getDoctorById(id);
      if (doctor.userId !== user.userId && !user.roles?.some(r => ['admin'].includes(r))) {
        throw new ForbiddenError('Access denied');
      }

      return await doctorService.setDoctorUnavailable(id, reason);
    },
  },

  Doctor: {
    id: (parent) => parent._id?.toString() || parent.id,
    fullName: (parent) => {
      if (parent.fullName) return parent.fullName;
      return `${parent.firstName} ${parent.lastName}`;
    },
  },
};

module.exports = resolvers;

