const { ApolloError, AuthenticationError, ForbiddenError } = require('apollo-server-express');
const patientService = require('../services/patient.service');


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
        }
    }
}


const resolvers = {
    ...DateScalar,
    Query: {
        patient: async (parent, { id }, { user }) => {
            if (!user) throw new AuthenticationError('Authentication required');
            return await patientService.getPatientById(id);
        },

        patientByUserId: async (parent, { userId }, { user }) => {
            if (!user) throw new AuthenticationError('Authentication required');
            // only clinicians can query by userId
            if (!user.roles || !user.roles.some(r => ['doctor', 'clinician', 'admin'].includes(r))) {
                throw new ForbiddenError('Insufficient permissions');
            }
            return await patientService.getPatientByUserId(userId);
        },

        me: async (parent, args, { user }) => {
            if (!user) throw new AuthenticationError('Authentication required');
            return await patientService.getPatientByUserId(user.userId);
        },

        patients: async (parent, { page, limit, filters }, { user }) => {
            if (!user) throw new AuthenticationError('Authentication required');
            // only clinicains can list all patients
            if (!user.roles || !user.roles.some(r => ['doctor', 'clinician', 'admin'].includes(r))) {
                throw new ForbiddenError('Insufficient permissions');
            }
            return await patientService.getAllPatients(filters || {}, page, limit, true);
        }
    },

    Mutation:{
        createPatient: async (parent, {input}, {user}) => {
            if (!user) throw new AuthenticationError('Authentication required');
            // if userId not provided, use authenicated user's id
            if(!input.userId && user.userId){
                input.userId = user.userId;
            }
            return await patientService.createPatient(input);
        },
        updatePatient: async (parent, {id, input}, {user}) => {
            if (!user) throw new AuthenticationError('Authentication required');

            // patient can only update their own profile
            const patient = await patientService.getPatientById(id);
            if(patient.userId !== user.userId && !user.roles?.some(r => ['doctor', 'clinician', 'admin'].includes(r))){
                throw new ForbiddenError('Insufficient permissions');
            }
            return await patientService.updatePatient(id, input);
        },
        deletePatient: async (parent, {id}, {user}) => {
            if (!user) throw new AuthenticationError('Authentication required');

            // only clinicians can delete patients
            if (!user.roles || !user.roles.some(r => ['doctor', 'clinician', 'admin'].includes(r))) {
                throw new ForbiddenError('Insufficient permissions');
            }

            await patientService.deletePatient(id);
            return true;
        },

        addMedicalHistory: async (parent, {id, history}, {user}) => {
            if (!user) throw new AuthenticationError('Authentication required');

            // only clinicians can add medical history
            if (!user.roles || !user.roles.some(r => ['doctor', 'clinician', 'admin'].includes(r))) {
                throw new ForbiddenError('Insufficient permissions');
            }

            return await patientService.addMedicalHistory(id, history);
        },

        addAllergy: async (parent, {id, allergy}, {user}) => {
            if (!user) throw new AuthenticationError('Authentication required');

            // only clinicians can add allergy
            if (!user.roles || !user.roles.some(r => ['doctor', 'clinician', 'admin'].includes(r))) {
                throw new ForbiddenError('Insufficient permissions');
            }
            return await patientService.addAllergy(id, allergy);
        },

        addMedication: async (parent, {id, medication}, {user}) => {
            if (!user) throw new AuthenticationError('Authentication required');

            // only clinicians can add medication
            if (!user.roles || !user.roles.some(r => ['doctor', 'clinician', 'admin'].includes(r))) {
                throw new ForbiddenError('Insufficient permissions');
            }
            return await patientService.addMedication(id, medication);
        }
    },

    Patient: {
        id: (parent) => parent._id.toString() || parent.id,
        age: (parent) => {
            if (parent.age !== undefined) return parent.age;
            if (!parent.dateOfBirth) return null;
            const today = new Date();
            const birthDate = new Date(parent.dateOfBirth);
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            return age;
        },
        fullName: (parent) => {
            if (parent.fullName) return parent.fullName;
            return `${parent.firstName} ${parent.lastName}`;
        },
    },
};


module.exports = resolvers;