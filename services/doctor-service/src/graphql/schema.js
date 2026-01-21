const { gql } = require('apollo-server-express');

const typeDefs = gql`
  scalar Date

  type Address {
    street: String
    city: String!
    state: String!
    zipCode: String!
    country: String
  }

  type Qualification {
    degree: String!
    institution: String!
    year: Int!
    country: String
  }

  type License {
    licenseNumber: String!
    issuingAuthority: String!
    issueDate: Date!
    expiryDate: Date!
    state: String!
    isActive: Boolean!
  }

  type ScheduleSlot {
    date: Date!
    startTime: String!
    endTime: String!
    status: String!
    appointmentId: String
  }

  type WeeklySchedule {
    dayOfWeek: Int!
    isAvailable: Boolean!
    startTime: String
    endTime: String
    breakStartTime: String
    breakEndTime: String
  }

  type Doctor {
    id: ID!
    userId: String
    firstName: String!
    lastName: String!
    email: String!
    phone: String
    dateOfBirth: Date
    gender: String
    address: Address
    specializations: [String!]!
    qualifications: [Qualification!]!
    licenses: [License!]!
    yearsOfExperience: Int
    bio: String
    weeklySchedule: [WeeklySchedule!]!
    availabilitySlots: [ScheduleSlot!]!
    status: String!
    registrationDate: Date
    lastActiveDate: Date
    notes: String
    fullName: String
  }

  type PaginationInfo {
    page: Int!
    limit: Int!
    total: Int!
    pages: Int!
  }

  type DoctorsResponse {
    doctors: [Doctor!]!
    pagination: PaginationInfo!
  }

  input AddressInput {
    street: String
    city: String!
    state: String!
    zipCode: String!
    country: String
  }

  input QualificationInput {
    degree: String!
    institution: String!
    year: Int!
    country: String
  }

  input LicenseInput {
    licenseNumber: String!
    issuingAuthority: String!
    issueDate: Date!
    expiryDate: Date!
    state: String!
    isActive: Boolean
  }

  input ScheduleSlotInput {
    date: Date!
    startTime: String!
    endTime: String!
  }

  input WeeklyScheduleInput {
    dayOfWeek: Int!
    isAvailable: Boolean!
    startTime: String
    endTime: String
    breakStartTime: String
    breakEndTime: String
  }

  input CreateDoctorInput {
    userId: String
    firstName: String!
    lastName: String!
    email: String!
    phone: String
    dateOfBirth: Date
    gender: String
    address: AddressInput
    specializations: [String!]
    qualifications: [QualificationInput!]
    licenses: [LicenseInput!]
    yearsOfExperience: Int
    bio: String
  }

  input UpdateDoctorInput {
    firstName: String
    lastName: String
    email: String
    phone: String
    address: AddressInput
    specializations: [String!]
    yearsOfExperience: Int
    bio: String
  }

  input DoctorFilters {
    status: String
    specialization: String
    city: String
    search: String
    availableDate: Date
    availableTime: String
  }

  type Query {
    # Get doctor by ID
    doctor(id: ID!): Doctor
    
    # Get doctor by user ID
    doctorByUserId(userId: String!): Doctor
    
    # Get current user's doctor profile
    me: Doctor
    
    # Get all doctors with pagination and filters
    doctors(
      page: Int = 1
      limit: Int = 10
      filters: DoctorFilters
    ): DoctorsResponse!
    
    # Get available doctors for date/time
    availableDoctors(
      date: Date!
      startTime: String
      endTime: String
      specialization: String
    ): [Doctor!]!
  }

  type Mutation {
    # Create a new doctor
    createDoctor(input: CreateDoctorInput!): Doctor!
    
    # Update doctor
    updateDoctor(id: ID!, input: UpdateDoctorInput!): Doctor!
    
    # Delete doctor (soft delete)
    deleteDoctor(id: ID!): Boolean!
    
    # Add specialization
    addSpecialization(id: ID!, specialization: String!): Doctor!
    
    # Remove specialization
    removeSpecialization(id: ID!, specialization: String!): Doctor!
    
    # Add availability slot
    addAvailabilitySlot(id: ID!, slot: ScheduleSlotInput!): Doctor!
    
    # Update slot status
    updateSlotStatus(id: ID!, slotId: ID!, status: String!, appointmentId: String): Doctor!
    
    # Update weekly schedule
    updateWeeklySchedule(id: ID!, weeklySchedule: [WeeklyScheduleInput!]!): Doctor!
    
    # Set doctor unavailable
    setDoctorUnavailable(id: ID!, reason: String): Doctor!
  }
`;

module.exports = typeDefs;

