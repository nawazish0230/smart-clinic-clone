const mongoose = require('mongoose');

/**
 * Event Store for Event Sourcing Pattern
 * Stores all appointment state changes as immutable events
 */
const appointmentEventSchema = new mongoose.Schema(
  {
    // Event Identification
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      index: true,
    },
    
    // Related Entity
    appointmentId: {
      type: String,
      required: true,
      index: true,
    },
    
    // Event Data (snapshot of state at time of event)
    eventData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    
    // Metadata
    triggeredBy: {
      type: String, // User ID or system
    },
    correlationId: {
      type: String,
      index: true,
    },
    sagaId: {
      type: String,
      index: true,
    },
    
    // Timestamp
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    
    // Event version (for optimistic locking)
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
appointmentEventSchema.index({ appointmentId: 1, occurredAt: 1 });
appointmentEventSchema.index({ eventType: 1, occurredAt: -1 });
appointmentEventSchema.index({ sagaId: 1, occurredAt: 1 });

/**
 * Create event from appointment state change
 */
appointmentEventSchema.statics.createEvent = async function (eventType, appointment, metadata = {}) {
  const { v4: uuidv4 } = require('uuid');
  
  const event = {
    eventId: uuidv4(),
    eventType,
    appointmentId: appointment._id.toString(),
    eventData: {
      appointment: appointment.toObject(),
      previousState: metadata.previousState,
    },
    triggeredBy: metadata.triggeredBy || 'system',
    correlationId: metadata.correlationId,
    sagaId: metadata.sagaId,
    occurredAt: new Date(),
    version: metadata.version || 1,
  };
  
  return await this.create(event);
};

/**
 * Get event stream for appointment (for replay/reconstruction)
 */
appointmentEventSchema.statics.getEventStream = function (appointmentId) {
  return this.find({ appointmentId })
    .sort({ occurredAt: 1 })
    .lean();
};

/**
 * Reconstruct appointment state from events
 */
appointmentEventSchema.statics.reconstructAppointment = async function (appointmentId) {
  const events = await this.getEventStream(appointmentId);
  
  // Start with initial state
  let appointment = null;
  
  // Apply events in order
  for (const event of events) {
    if (event.eventType === 'AppointmentCreated') {
      appointment = event.eventData.appointment;
    } else if (event.eventType === 'AppointmentUpdated') {
      appointment = { ...appointment, ...event.eventData.appointment };
    } else if (event.eventType === 'AppointmentConfirmed') {
      appointment = { ...appointment, status: 'confirmed', confirmedAt: event.occurredAt };
    } else if (event.eventType === 'AppointmentCancelled') {
      appointment = { ...appointment, status: 'cancelled', cancelledAt: event.occurredAt };
    } else if (event.eventType === 'AppointmentCompleted') {
      appointment = { ...appointment, status: 'completed', completedAt: event.occurredAt };
    }
  }
  
  return appointment;
};

const AppointmentEvent = mongoose.model('AppointmentEvent', appointmentEventSchema);

module.exports = AppointmentEvent;

