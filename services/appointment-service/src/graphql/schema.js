const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Date

  type Appointment {
    id: ID!
    patientId: String!
    patientName: String!
    patientEmail: String
    patientPhone: String
    doctorId: String!
    doctorName: String!
    doctorSpecialization: String
    appointmentDate: Date!
    startTime: String!
    endTime: String!
    duration: Int!
    slotId: String
    type: AppointmentType!
    reason: String
    notes: String
    status: AppointmentStatus!
    invoiceId: String
    amount: Float
    paymentStatus: String
    sagaId: String
    sagaState: String
    createdBy: String
    cancelledBy: String
    cancellationReason: String
    cancelledAt: Date
    confirmedAt: Date
    completedAt: Date
    createdAt: Date!
    updatedAt: Date!
  }

  enum AppointmentStatus {
    pending
    confirmed
    cancelled
    completed
    no_show
    rescheduled
  }

  enum AppointmentType {
    consultation
    follow_up
    checkup
    emergency
    surgery
    other
  }

  input CreateAppointmentInput {
    patientId: String!
    doctorId: String!
    appointmentDate: Date!
    startTime: String!
    endTime: String!
    duration: Int
    type: AppointmentType
    reason: String
    notes: String
    amount: Float
  }

  input UpdateAppointmentInput {
    appointmentDate: Date
    startTime: String
    endTime: String
    reason: String
    notes: String
  }

  input AppointmentFilters {
    status: AppointmentStatus
    patientId: String
    doctorId: String
    startDate: Date
    endDate: Date
  }

  type PaginatedAppointments {
    appointments: [Appointment!]!
    pagination: Pagination!
  }

  type Pagination {
    page: Int!
    limit: Int!
    total: Int!
    pages: Int!
  }

  type Query {
    # Get appointment by ID
    appointment(id: ID!): Appointment

    # Get appointments by patient ID
    appointmentsByPatient(patientId: String!, filters: AppointmentFilters): [Appointment!]!

    # Get appointments by doctor ID
    appointmentsByDoctor(doctorId: String!, filters: AppointmentFilters): [Appointment!]!

    # Get all appointments with pagination
    appointments(
      filters: AppointmentFilters
      page: Int
      limit: Int
      useReadView: Boolean
    ): PaginatedAppointments!
  }

  type Mutation {
    # Create appointment
    createAppointment(input: CreateAppointmentInput!): Appointment!

    # Update appointment
    updateAppointment(id: ID!, input: UpdateAppointmentInput!): Appointment!

    # Cancel appointment
    cancelAppointment(id: ID!, reason: String): Appointment!

    # Confirm appointment
    confirmAppointment(id: ID!): Appointment!

    # Complete appointment
    completeAppointment(id: ID!): Appointment!

    # Reschedule appointment
    rescheduleAppointment(
      id: ID!
      appointmentDate: Date!
      startTime: String!
      endTime: String!
    ): Appointment!
  }
`;

module.exports = typeDefs;

