const mongoose = require('mongoose');

/**
 * Outbox Pattern - Ensures events are published even if service fails
 * Events are stored in database first, then published asynchronously
 */
const outboxEventSchema = new mongoose.Schema(
  {
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
    topic: {
      type: String,
      required: true,
      default: 'appointment-events',
    },
    eventData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'published', 'failed'],
      default: 'pending',
      index: true,
    },
    publishedAt: {
      type: Date,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for processing pending events
outboxEventSchema.index({ status: 1, createdAt: 1 });

/**
 * Create outbox event
 */
outboxEventSchema.statics.createEvent = async function (eventType, eventData, topic = 'appointment-events') {
  const { v4: uuidv4 } = require('uuid');
  
  return await this.create({
    eventId: uuidv4(),
    eventType,
    topic,
    eventData,
    status: 'pending',
  });
};

/**
 * Mark event as published
 */
outboxEventSchema.methods.markAsPublished = function () {
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

/**
 * Mark event as failed
 */
outboxEventSchema.methods.markAsFailed = function (error) {
  this.status = 'failed';
  this.error = error.message;
  this.retryCount += 1;
  return this.save();
};

/**
 * Get pending events for processing
 */
outboxEventSchema.statics.getPendingEvents = function (limit = 100) {
  return this.find({ status: 'pending' })
    .sort({ createdAt: 1 })
    .limit(limit)
    .lean();
};

const OutboxEvent = mongoose.model('OutboxEvent', outboxEventSchema);

module.exports = OutboxEvent;

