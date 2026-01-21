require('dotenv').config();
const mongoose = require('mongoose');
const { Doctor, DOCTOR_STATUS, SLOT_STATUS } = require('../models/Doctor');
const DoctorScheduleReadView = require('../models/DoctorScheduleReadView');
const connectDatabase = require('../config/database');

// Sample seed data - linked to Auth Service users
// Note: These userIds should match users created in Auth Service seed
const seedDoctors = [
  {
    userId: 'seed-doctor-1',
    email: 'doctor.smith@smartclinic.com',
    firstName: 'Sarah',
    lastName: 'Smith',
    phone: '+1234567801',
    dateOfBirth: new Date('1980-05-15'),
    gender: 'female',
    address: {
      street: '100 Medical Center Drive',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    specializations: ['cardiology', 'internal medicine'],
    qualifications: [
      {
        degree: 'MD',
        institution: 'Harvard Medical School',
        year: 2005,
        country: 'USA',
      },
      {
        degree: 'Residency in Cardiology',
        institution: 'Johns Hopkins Hospital',
        year: 2008,
        country: 'USA',
      },
    ],
    licenses: [
      {
        licenseNumber: 'MD123456',
        issuingAuthority: 'New York State Medical Board',
        issueDate: new Date('2005-06-01'),
        expiryDate: new Date('2025-06-01'),
        state: 'NY',
        isActive: true,
      },
    ],
    yearsOfExperience: 18,
    bio: 'Board-certified cardiologist with 18 years of experience in treating cardiovascular diseases.',
    weeklySchedule: [
      { dayOfWeek: 1, isAvailable: true, startTime: '09:00', endTime: '17:00' }, // Monday
      { dayOfWeek: 2, isAvailable: true, startTime: '09:00', endTime: '17:00' }, // Tuesday
      { dayOfWeek: 3, isAvailable: true, startTime: '09:00', endTime: '17:00' }, // Wednesday
      { dayOfWeek: 4, isAvailable: true, startTime: '09:00', endTime: '17:00' }, // Thursday
      { dayOfWeek: 5, isAvailable: true, startTime: '09:00', endTime: '13:00' }, // Friday
    ],
  },
  {
    userId: 'seed-doctor-2',
    email: 'doctor.johnson@smartclinic.com',
    firstName: 'Michael',
    lastName: 'Johnson',
    phone: '+1234567802',
    dateOfBirth: new Date('1975-08-20'),
    gender: 'male',
    address: {
      street: '200 Healthcare Avenue',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'USA',
    },
    specializations: ['orthopedics', 'sports medicine'],
    qualifications: [
      {
        degree: 'MD',
        institution: 'Stanford Medical School',
        year: 2000,
        country: 'USA',
      },
    ],
    licenses: [
      {
        licenseNumber: 'MD789012',
        issuingAuthority: 'California Medical Board',
        issueDate: new Date('2000-07-01'),
        expiryDate: new Date('2024-07-01'),
        state: 'CA',
        isActive: true,
      },
    ],
    yearsOfExperience: 23,
    bio: 'Orthopedic surgeon specializing in sports medicine and joint replacement.',
    weeklySchedule: [
      { dayOfWeek: 1, isAvailable: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 2, isAvailable: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 3, isAvailable: true, startTime: '08:00', endTime: '16:00' },
      { dayOfWeek: 4, isAvailable: true, startTime: '08:00', endTime: '16:00' },
    ],
  },
  {
    userId: 'seed-doctor-3',
    email: 'doctor.williams@smartclinic.com',
    firstName: 'Emily',
    lastName: 'Williams',
    phone: '+1234567803',
    dateOfBirth: new Date('1985-03-10'),
    gender: 'female',
    address: {
      street: '300 Clinic Road',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA',
    },
    specializations: ['pediatrics', 'family medicine'],
    qualifications: [
      {
        degree: 'MD',
        institution: 'Northwestern Medical School',
        year: 2010,
        country: 'USA',
      },
    ],
    licenses: [
      {
        licenseNumber: 'MD345678',
        issuingAuthority: 'Illinois Medical Board',
        issueDate: new Date('2010-06-01'),
        expiryDate: new Date('2024-06-01'),
        state: 'IL',
        isActive: true,
      },
    ],
    yearsOfExperience: 13,
    bio: 'Pediatrician with expertise in child development and preventive care.',
    weeklySchedule: [
      { dayOfWeek: 1, isAvailable: true, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 2, isAvailable: true, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 3, isAvailable: true, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 4, isAvailable: true, startTime: '10:00', endTime: '18:00' },
      { dayOfWeek: 5, isAvailable: true, startTime: '10:00', endTime: '18:00' },
    ],
  },
];

/**
 * Generate availability slots for next 30 days
 */
const generateAvailabilitySlots = (doctor, weeklySchedule) => {
  const slots = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dayOfWeek = date.getDay();
    
    const schedule = weeklySchedule.find(s => s.dayOfWeek === dayOfWeek && s.isAvailable);
    if (schedule && schedule.startTime && schedule.endTime) {
      // Generate hourly slots
      const start = parseInt(schedule.startTime.split(':')[0]);
      const end = parseInt(schedule.endTime.split(':')[0]);
      
      for (let hour = start; hour < end; hour++) {
        const slotDate = new Date(date);
        slotDate.setHours(0, 0, 0, 0);
        slots.push({
          date: slotDate,
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          status: SLOT_STATUS.AVAILABLE,
        });
      }
    }
  }
  
  return slots;
};

/**
 * Seed database with sample doctors
 */
const seedDoctorsData = async (reset = false) => {
  try {
    await connectDatabase();

    if (reset) {
      console.log('🗑️  Clearing existing doctors...');
      await Doctor.deleteMany({});
      await DoctorScheduleReadView.deleteMany({});
    }

    console.log('🌱 Seeding doctors...');

    for (const doctorData of seedDoctors) {
      // Check if doctor already exists
      const existing = await Doctor.findByEmail(doctorData.email);
      if (existing) {
        console.log(`⏭️  Skipping ${doctorData.email} (already exists)`);
        continue;
      }

      // Generate availability slots
      const availabilitySlots = generateAvailabilitySlots(doctorData, doctorData.weeklySchedule);
      doctorData.availabilitySlots = availabilitySlots;

      // Create doctor
      const doctor = new Doctor(doctorData);
      await doctor.save();

      // Update read view (CQRS)
      await DoctorScheduleReadView.updateFromDoctor(doctor);

      console.log(`✅ Created doctor: ${doctor.email} (${doctor._id})`);
    }

    console.log('✅ Seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const reset = args.includes('--reset');

// Run seed
seedDoctorsData(reset);

