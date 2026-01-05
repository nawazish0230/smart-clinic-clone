# Doctor Service

Doctor Management microservice for Smart Clinic platform. This service handles doctor profiles, specializations, schedules, availability management, and qualifications. It implements CQRS pattern for optimized schedule queries and event-driven architecture for real-time updates.

## Table of Contents

- [Features](#features)
- [Quick Start Guide](#quick-start-guide)
- [Implementation Steps](#implementation-steps)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Microservices Patterns Implementation](#microservices-patterns-implementation)
- [Architecture & Flow](#architecture--flow)
- [Testing Examples](#testing-examples)
- [Project Structure](#project-structure)
- [Integration Details](#integration-details)
- [Troubleshooting](#troubleshooting)
- [Next Steps](#next-steps)

---

## Features

### Core Features

- ✅ Doctor CRUD operations
- ✅ Specialization management
- ✅ Schedule and availability management
- ✅ Weekly schedule configuration
- ✅ Availability slot management
- ✅ Qualification and license tracking
- ✅ MongoDB database integration
- ✅ Integration with Auth Service for authentication
- ✅ Role-Based Access Control (RBAC)
- ✅ Input validation
- ✅ Error handling
- ✅ Request logging
- ✅ Swagger UI API documentation
- ✅ Database seeding with sample doctors

### Advanced Patterns Implemented

- ✅ **Database per Service** - Isolated doctor database
- ✅ **CQRS (Command Query Responsibility Segregation)** - Separate read-optimized views for fast schedule queries
- ✅ **Event-Driven Architecture** - Kafka integration for publishing doctor and schedule events
- ✅ **GraphQL API** - Flexible GraphQL endpoint with Apollo Server
- ✅ **REST API** - Full REST endpoints with Swagger documentation

---

## Quick Start Guide

### Prerequisites

- Node.js 18+ installed
- MongoDB running (localhost:27017 or configure MONGODB_URI)
- Auth Service running (for authentication)
- Kafka running (for event-driven architecture)
- npm or yarn package manager

### 1. Install Dependencies

```bash
cd services/doctor-service
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in `services/doctor-service/` with the following:

```env
# Server Configuration
PORT=3004
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/doctor_db

# Auth Service (for token validation)
AUTH_SERVICE_URL=http://localhost:3001

# Kafka Configuration (for Event-Driven Architecture)
KAFKA_BROKERS=localhost:9092

# Service Configuration
SERVICE_NAME=doctor-service
LOG_LEVEL=info
```

**Important**: Make sure Auth Service is running and accessible at `AUTH_SERVICE_URL`!

### 3. Start MongoDB

Make sure MongoDB is running:

```bash
# If MongoDB is installed locally
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:7
```

### 4. Start Kafka (for Event-Driven Architecture)

```bash
# Using Docker
docker run -d -p 9092:9092 --name kafka apache/kafka:latest

# Or use docker-compose from infrastructure/docker
```

**Note**: The service will continue to work if Kafka is unavailable (graceful degradation), but events won't be published.

### 5. Start Auth Service

The Doctor Service requires Auth Service to be running for authentication. Start Auth Service first:

```bash
cd ../auth-service
npm install
npm run dev
```

### 6. Seed Database (Optional but Recommended)

Create sample doctors for testing:

```bash
# Add sample doctors (skips existing)
npm run seed

# Or reset and reseed (clears all doctors first)
npm run seed:reset
```

This creates 3 sample doctors with specializations, schedules, and availability slots.

**Note**: The seed script creates placeholder user IDs. In production, link doctors to actual Auth Service users.

### 7. Start the Service

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The service will start on `http://localhost:3004`

**Important URLs:**
- **REST API**: `http://localhost:3004/api/doctors`
- **GraphQL Playground**: `http://localhost:3004/graphql` (Interactive GraphQL interface)
- **Swagger UI**: `http://localhost:3004/api-docs` (Interactive REST API documentation)
- **Health Check**: `http://localhost:3004/health`

---

## Implementation Steps

This section provides a step-by-step guide for implementing the Doctor Service from scratch, including all microservices patterns.

### Phase 1: Project Setup

#### Step 1.1: Initialize Project
```bash
mkdir doctor-service
cd doctor-service
npm init -y
```

#### Step 1.2: Install Core Dependencies
```bash
# Express and core dependencies
npm install express cors helmet dotenv express-async-errors

# MongoDB
npm install mongoose

# Validation
npm install express-validator

# Logging
npm install winston

# Swagger/OpenAPI
npm install swagger-ui-express swagger-jsdoc

# Development dependencies
npm install --save-dev nodemon
```

#### Step 1.3: Create Project Structure
```bash
mkdir -p src/{config,controllers,middleware,models,routes,services,utils,scripts,graphql}
```

#### Step 1.4: Create Configuration Files
- Create `.env` file with environment variables
- Create `src/config/index.js` for configuration management
- Create `src/config/database.js` for MongoDB connection
- Create `src/config/swagger.js` for Swagger documentation

---

### Phase 2: Database Setup (Database per Service Pattern)

#### Step 2.1: Create Doctor Model
Create `src/models/Doctor.js`:
- Define Mongoose schema with all doctor fields
- Add specializations array
- Add qualifications and licenses
- Add weekly schedule schema
- Add availability slots schema
- Add validation rules
- Add static methods (findByUserId, findByEmail, findBySpecialization, findAvailable)
- Add instance methods (addSpecialization, removeSpecialization, addAvailabilitySlot, updateSlotStatus)
- Export enums (DOCTOR_STATUS, SLOT_STATUS)

#### Step 2.2: Create CQRS Read Model
Create `src/models/DoctorScheduleReadView.js`:
- Define read-optimized schema with denormalized fields
- Add computed fields (nextAvailableSlot, availableSlotsCount, bookedSlotsCount)
- Create compound indexes for availability queries
- Add static method `updateFromDoctor()` to sync from write model
- Add static method `findAvailableDoctors()` for optimized availability queries

#### Step 2.3: Connect to MongoDB
- Implement `src/config/database.js` with connection logic
- Add connection error handling
- Add graceful shutdown handling

---

### Phase 3: Core Service Layer

#### Step 3.1: Create Utility Functions
- `src/utils/logger.js` - Winston logger configuration
- `src/utils/errors.js` - Custom error classes (ValidationError, NotFoundError, etc.)
- `src/utils/auth.js` - Auth Service integration for token validation
- `src/utils/eventProducer.js` - Kafka producer for event publishing

#### Step 3.2: Create Doctor Service
Create `src/services/doctor.service.js`:
- Implement `createDoctor()` - Create new doctor
- Implement `getDoctorById()` - Get doctor by ID
- Implement `getDoctorByUserId()` - Get doctor by user ID
- Implement `getAllDoctors()` - List doctors with pagination and filters (CQRS)
- Implement `updateDoctor()` - Update doctor information
- Implement `deleteDoctor()` - Soft delete doctor
- Implement `addSpecialization()` - Add specialization
- Implement `removeSpecialization()` - Remove specialization
- Implement `addAvailabilitySlot()` - Add availability slot
- Implement `updateSlotStatus()` - Update slot status (for booking)
- Implement `getAvailableDoctors()` - Get available doctors for date/time (CQRS)
- Implement `updateWeeklySchedule()` - Update weekly schedule
- Implement `setDoctorUnavailable()` - Set doctor unavailable

**CQRS Implementation:**
- After each write operation, call `DoctorScheduleReadView.updateFromDoctor()`
- Use read view for availability queries (`getAvailableDoctors`, `getAllDoctors` with availability filters)
- Keep `Doctor` model for write operations

---

### Phase 4: REST API Implementation

#### Step 4.1: Create Middleware
- `src/middleware/auth.middleware.js` - JWT authentication middleware
- `src/middleware/rbac.middleware.js` - Role-based access control
- `src/middleware/validator.middleware.js` - Input validation
- `src/middleware/error.middleware.js` - Error handling middleware

#### Step 4.2: Create Controllers
Create `src/controllers/doctor.controller.js`:
- Implement controller methods that call service layer
- Handle request/response formatting
- Apply error handling

#### Step 4.3: Create Routes
Create `src/routes/doctor.routes.js`:
- Define REST endpoints
- Apply authentication middleware
- Apply RBAC middleware
- Apply validation middleware
- Connect routes to controllers

Create `src/routes/health.routes.js`:
- Health check endpoint
- Readiness check endpoint

#### Step 4.4: Setup Express App
Create `src/index.js`:
- Initialize Express app
- Configure middleware (helmet, cors, body-parser)
- Setup Swagger UI
- Register routes
- Setup error handling
- Connect to database
- Start server

---

### Phase 5: CQRS Pattern Implementation

#### Step 5.1: Create Read Model
Create `src/models/DoctorScheduleReadView.js`:
- Define read-optimized schema with denormalized fields
- Add computed fields (nextAvailableSlot, availableSlotsCount, bookedSlotsCount)
- Create text search indexes
- Create compound indexes for common queries (specialization + date + availability)
- Add static method `updateFromDoctor()` to sync from write model
- Add static method `findAvailableDoctors()` for optimized availability queries

#### Step 5.2: Update Service Layer for CQRS
Update `src/services/doctor.service.js`:
- After each write operation, call `DoctorScheduleReadView.updateFromDoctor()`
- Modify `getAllDoctors()` to use `DoctorScheduleReadView` when availability filters are present
- Modify `getAvailableDoctors()` to use read view for fast queries
- Keep `Doctor` model for write operations
- Use read view for list/search queries with availability filters

**Example:**
```javascript
// In createDoctor()
await doctor.save();
await DoctorScheduleReadView.updateFromDoctor(doctor); // CQRS sync

// In getAvailableDoctors() - Use read view
const readViews = await DoctorScheduleReadView.findAvailableDoctors(date, specialization);
```

---

### Phase 6: Event-Driven Architecture

#### Step 6.1: Install Kafka Dependencies
```bash
npm install kafkajs
```

#### Step 6.2: Create Event Producer
Create `src/utils/eventProducer.js`:
- Initialize Kafka producer
- Define event types (DoctorCreated, DoctorUpdated, ScheduleUpdated, etc.)
- Implement `publishEvent()` function
- Add graceful degradation (service continues if Kafka unavailable)
- Add producer initialization and shutdown functions

#### Step 6.3: Publish Events in Service Layer
Update `src/services/doctor.service.js`:
- After each write operation, publish corresponding event
- Publish `DoctorCreated` on doctor creation
- Publish `DoctorUpdated` on doctor update
- Publish `DoctorDeleted` on doctor deletion
- Publish `ScheduleUpdated` when schedule changes
- Publish `ScheduleSlotAdded` when adding slots
- Publish `ScheduleSlotRemoved` when removing slots
- Publish `DoctorUnavailable` when setting unavailable
- Publish `DoctorAvailable` when slot becomes available
- Publish `SpecializationAdded` when adding specialization
- Publish `SpecializationRemoved` when removing specialization

**Example:**
```javascript
// In createDoctor()
await publishEvent(EVENT_TYPES.DOCTOR_CREATED, {
  doctorId: doctor._id,
  userId: doctor.userId,
  email: doctor.email,
  firstName: doctor.firstName,
  lastName: doctor.lastName,
  specializations: doctor.specializations,
});
```

#### Step 6.4: Initialize Kafka Producer
Update `src/index.js`:
- Call `initializeProducer()` on server start
- Call `shutdownProducer()` on graceful shutdown

---

### Phase 7: GraphQL API Implementation

#### Step 7.1: Install GraphQL Dependencies
```bash
npm install apollo-server-express graphql @graphql-tools/schema
```

#### Step 7.2: Create GraphQL Schema
Create `src/graphql/schema.js`:
- Define GraphQL types (Doctor, Address, Qualification, License, ScheduleSlot, WeeklySchedule)
- Define Query type (doctor, doctorByUserId, me, doctors, availableDoctors)
- Define Mutation type (createDoctor, updateDoctor, deleteDoctor, addSpecialization, etc.)
- Define Input types for mutations

#### Step 7.3: Create GraphQL Context
Create `src/graphql/context.js`:
- Extract JWT token from request headers
- Validate token with Auth Service
- Return user information for resolvers
- Handle authentication errors

#### Step 7.4: Create GraphQL Resolvers
Create `src/graphql/resolvers.js`:
- Implement Query resolvers
- Implement Mutation resolvers
- Add RBAC checks in resolvers
- Call service layer methods
- Handle errors appropriately

#### Step 7.5: Integrate Apollo Server
Update `src/index.js`:
- Import GraphQL schema and resolvers
- Create Apollo Server instance
- Configure context function
- Apply Apollo middleware to Express app
- Start Apollo Server before Express server

---

### Phase 8: Authentication & Authorization

#### Step 8.1: Implement Auth Middleware
- Extract JWT token from Authorization header
- Call Auth Service to validate token
- Attach user info to request object
- Handle authentication errors

#### Step 8.2: Implement RBAC Middleware
- Check user roles from request
- Allow/deny access based on role
- Doctor role: own data only
- Admin/Clinician roles: all data

#### Step 8.3: Apply Middleware to Routes
- Apply auth middleware to all protected routes
- Apply RBAC middleware where needed
- Apply to GraphQL resolvers

---

### Phase 9: Testing & Validation

#### Step 9.1: Create Seed Script
Create `src/scripts/seed.js`:
- Create sample doctors
- Add specializations, qualifications, licenses
- Generate availability slots
- Add to package.json scripts

#### Step 9.2: Test REST API
- Test all CRUD operations
- Test authentication
- Test RBAC
- Test validation
- Test schedule management

#### Step 9.3: Test GraphQL API
- Test queries in GraphQL Playground
- Test mutations
- Test authentication
- Test RBAC

#### Step 9.4: Test CQRS
- Create doctor (write)
- Verify read view is updated
- Query available doctors (read)
- Verify performance improvement

#### Step 9.5: Test Event-Driven
- Create/update doctor
- Update schedule
- Verify events published to Kafka
- Check Kafka topic for events

---

### Phase 10: Documentation & Polish

#### Step 10.1: Complete Swagger Documentation
- Document all REST endpoints
- Add request/response examples
- Add authentication examples

#### Step 10.2: Add Error Handling
- Custom error classes
- Error middleware
- Proper error responses

#### Step 10.3: Add Logging
- Request logging
- Error logging
- Event logging

#### Step 10.4: Add Health Checks
- Health endpoint
- Readiness endpoint
- Database connection check

---

### Implementation Checklist

- [ ] Phase 1: Project setup and structure
- [ ] Phase 2: Database setup (Database per Service + CQRS)
- [ ] Phase 3: Core service layer
- [ ] Phase 4: REST API implementation
- [ ] Phase 5: CQRS pattern (Read model)
- [ ] Phase 6: Event-Driven Architecture (Kafka)
- [ ] Phase 7: GraphQL API
- [ ] Phase 8: Authentication & Authorization
- [ ] Phase 9: Testing & Validation
- [ ] Phase 10: Documentation & Polish

---

### Key Files Created

```
doctor-service/
├── src/
│   ├── config/
│   │   ├── index.js          # Configuration management
│   │   ├── database.js       # MongoDB connection
│   │   └── swagger.js         # Swagger documentation
│   ├── controllers/
│   │   └── doctor.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── rbac.middleware.js
│   │   ├── validator.middleware.js
│   │   └── error.middleware.js
│   ├── models/
│   │   ├── Doctor.js         # Write model
│   │   └── DoctorScheduleReadView.js # Read model (CQRS)
│   ├── routes/
│   │   ├── doctor.routes.js
│   │   └── health.routes.js
│   ├── services/
│   │   └── doctor.service.js
│   ├── graphql/
│   │   ├── schema.js          # GraphQL schema
│   │   ├── resolvers.js       # GraphQL resolvers
│   │   └── context.js         # GraphQL context
│   ├── utils/
│   │   ├── auth.js            # Auth Service integration
│   │   ├── logger.js          # Winston logger
│   │   ├── errors.js          # Custom errors
│   │   └── eventProducer.js   # Kafka producer
│   ├── scripts/
│   │   └── seed.js            # Database seeding
│   └── index.js               # Application entry point
├── package.json
├── Dockerfile
├── .env.example
└── README.md
```

---

### Implementation Order Summary

1. **Foundation**: Setup project, install dependencies, create structure
2. **Database**: Create Doctor model, CQRS read model, connect MongoDB
3. **Core Logic**: Implement service layer with business logic
4. **REST API**: Create controllers, routes, middleware
5. **CQRS**: Add read model for optimized schedule queries
6. **Events**: Integrate Kafka for event publishing
7. **GraphQL**: Add GraphQL API with Apollo Server
8. **Security**: Implement authentication and RBAC
9. **Testing**: Test all features and patterns
10. **Polish**: Documentation, error handling, logging

---

## Configuration

### Environment Variables

Required environment variables:

```env
# Server Configuration
PORT=3004
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/doctor_db

# Auth Service (for token validation)
AUTH_SERVICE_URL=http://localhost:3001

# Kafka Configuration (for Event-Driven Architecture)
KAFKA_BROKERS=localhost:9092

# Service Configuration
SERVICE_NAME=doctor-service
LOG_LEVEL=info
```

### Dependencies

Key dependencies added for advanced patterns:

```json
{
  "kafkajs": "^2.2.4",
  "apollo-server-express": "^3.12.1",
  "graphql": "^16.8.1",
  "@graphql-tools/schema": "^10.0.0"
}
```

### Installation & Scripts

```bash
# Install dependencies
npm install

# Seed database with sample doctors
npm run seed

# Reset and seed (clears existing doctors)
npm run seed:reset

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

### Docker

```bash
# Build image
docker build -t doctor-service .

# Run container
docker run -p 3004:3004 --env-file .env doctor-service
```

---

## API Documentation

### REST API Documentation

**Swagger UI**: `http://localhost:3004/api-docs`

The Swagger UI provides:
- Complete REST API endpoint documentation
- Interactive API testing
- Request/response schemas
- Authentication examples
- Try-it-out functionality

### GraphQL API

**GraphQL Playground**: `http://localhost:3004/graphql`

GraphQL provides:
- Flexible queries (request only needed fields)
- Single endpoint for all operations
- Type-safe API with schema introspection
- Interactive playground for testing
- Can be stitched with API Gateway for unified API

### API Endpoints

#### Public Endpoints

None - All endpoints require authentication (except health checks).

#### Protected Endpoints

##### Create Doctor
```
POST /api/doctors
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "firstName": "Dr. Sarah",
  "lastName": "Smith",
  "email": "sarah.smith@smartclinic.com",
  "specializations": ["cardiology", "internal medicine"],
  ...
}
```

##### Get My Profile
```
GET /api/doctors/me
Authorization: Bearer <access-token>
```

##### Get Doctor by ID
```
GET /api/doctors/{id}
Authorization: Bearer <access-token>
```

##### Get All Doctors
```
GET /api/doctors?page=1&limit=10&specialization=cardiology&availableDate=2024-01-15
Authorization: Bearer <access-token>
```

##### Get Available Doctors
```
GET /api/doctors/available?date=2024-01-15&startTime=09:00&endTime=10:00&specialization=cardiology
Authorization: Bearer <access-token>
```

##### Update Doctor
```
PUT /api/doctors/{id}
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "bio": "Updated bio",
  "specializations": ["cardiology", "internal medicine", "preventive care"]
}
```

##### Delete Doctor (Soft Delete - Clinicians only)
```
DELETE /api/doctors/{id}
Authorization: Bearer <access-token>
```

##### Add Specialization
```
POST /api/doctors/{id}/specializations
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "specialization": "preventive care"
}
```

##### Remove Specialization
```
DELETE /api/doctors/{id}/specializations
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "specialization": "preventive care"
}
```

##### Add Availability Slot
```
POST /api/doctors/{id}/availability
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "date": "2024-01-15",
  "startTime": "09:00",
  "endTime": "10:00"
}
```

##### Update Slot Status
```
PATCH /api/doctors/{id}/availability/{slotId}
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "status": "booked",
  "appointmentId": "appointment-id"
}
```

##### Update Weekly Schedule
```
PUT /api/doctors/{id}/schedule
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "weeklySchedule": [
    {
      "dayOfWeek": 1,
      "isAvailable": true,
      "startTime": "09:00",
      "endTime": "17:00"
    },
    ...
  ]
}
```

##### Set Doctor Unavailable
```
POST /api/doctors/{id}/unavailable
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "reason": "On leave"
}
```

#### Health Checks

##### Health Check
```
GET /health
```

##### Readiness Check
```
GET /ready
```

### GraphQL Queries and Mutations

#### Available Queries

- `doctor(id: ID!)` - Get doctor by ID
- `doctorByUserId(userId: String!)` - Get doctor by user ID
- `me` - Get current user's doctor profile
- `doctors(page: Int, limit: Int, filters: DoctorFilters)` - Get all doctors with pagination
- `availableDoctors(date: Date!, startTime: String, endTime: String, specialization: String)` - Get available doctors

#### Available Mutations

- `createDoctor(input: CreateDoctorInput!)` - Create a new doctor
- `updateDoctor(id: ID!, input: UpdateDoctorInput!)` - Update doctor
- `deleteDoctor(id: ID!)` - Delete doctor (soft delete)
- `addSpecialization(id: ID!, specialization: String!)` - Add specialization
- `removeSpecialization(id: ID!, specialization: String!)` - Remove specialization
- `addAvailabilitySlot(id: ID!, slot: ScheduleSlotInput!)` - Add availability slot
- `updateSlotStatus(id: ID!, slotId: ID!, status: String!, appointmentId: String)` - Update slot status
- `updateWeeklySchedule(id: ID!, weeklySchedule: [WeeklyScheduleInput!]!)` - Update weekly schedule
- `setDoctorUnavailable(id: ID!, reason: String)` - Set doctor unavailable

---

## Microservices Patterns Implementation

### 1. Database per Service Pattern ✅

**Status**: ✅ **FULLY IMPLEMENTED**

**Implementation**:
- Separate MongoDB database (`doctor_db`)
- Isolated doctor data
- Independent schema evolution
- No direct database access from other services

**Benefits**:
- ✅ Fault isolation
- ✅ Independent scaling
- ✅ Technology choice flexibility
- ✅ Independent deployment

---

### 2. CQRS Pattern ✅

**Status**: ✅ **FULLY IMPLEMENTED**

**Implementation**:
- **Write Model**: `Doctor` collection (for profile updates, schedule changes)
- **Read Model**: `DoctorScheduleReadView` collection (for availability queries)

**Write Operations** (use `Doctor` model):
- Create/update doctor profile
- Add/remove specializations
- Add/update availability slots
- Update weekly schedule

**Read Operations** (use `DoctorScheduleReadView`):
- Get available doctors for date/time
- List doctors with availability filters
- Fast schedule queries

**Synchronization**:
- After each write operation, `DoctorScheduleReadView.updateFromDoctor()` is called
- Read view is automatically updated with denormalized data

**Example Flow**:
```javascript
// Write operation
const doctor = await Doctor.findById(id);
doctor.addAvailabilitySlot(slot);
await doctor.save();

// Sync to read view (CQRS)
await DoctorScheduleReadView.updateFromDoctor(doctor);

// Read operation (optimized)
const availableDoctors = await DoctorScheduleReadView.findAvailableDoctors(date, specialization);
```

**Benefits**:
- ✅ Fast availability queries (denormalized, indexed)
- ✅ Write operations don't block reads
- ✅ Can scale reads independently
- ✅ Optimized for schedule queries

---

### 3. Event-Driven Architecture ✅

**Status**: ✅ **FULLY IMPLEMENTED**

**Implementation**:
- Kafka producer integrated
- Events published on state changes
- Graceful degradation (service continues if Kafka unavailable)

**Event Types**:
- `DoctorCreated` - When doctor is created
- `DoctorUpdated` - When doctor profile is updated
- `DoctorDeleted` - When doctor is deleted
- `ScheduleUpdated` - When schedule changes
- `ScheduleSlotAdded` - When availability slot is added
- `ScheduleSlotRemoved` - When availability slot is removed
- `DoctorUnavailable` - When doctor is set unavailable
- `DoctorAvailable` - When slot becomes available
- `SpecializationAdded` - When specialization is added
- `SpecializationRemoved` - When specialization is removed

**Kafka Topic**: `doctor-events`

**Event Consumers** (other services):
- Appointment Service → Listen for schedule updates
- Notification Service → Send notifications on schedule changes
- Audit Service → Log all doctor activities

**Example**:
```javascript
// In createDoctor()
await publishEvent(EVENT_TYPES.DOCTOR_CREATED, {
  doctorId: doctor._id.toString(),
  userId: doctor.userId,
  email: doctor.email,
  specializations: doctor.specializations,
});
```

**Benefits**:
- ✅ Loose coupling with other services
- ✅ Asynchronous processing
- ✅ Event sourcing capability
- ✅ Integration with Appointment, Notification, Audit services
- ✅ Service continues if Kafka unavailable (graceful degradation)

---

### 4. GraphQL API ✅

**Status**: ✅ **FULLY IMPLEMENTED**

**Implementation**:
- Apollo Server integrated with Express
- Complete GraphQL schema
- Resolvers with authentication and RBAC
- GraphQL Playground for development

**Endpoint**: `http://localhost:3004/graphql`

**Features**:
- Type-safe API
- Flexible queries (request only needed fields)
- Single endpoint for all operations
- Authentication via JWT
- RBAC in resolvers

**Files**:
- `src/graphql/schema.js` - GraphQL type definitions
- `src/graphql/resolvers.js` - GraphQL resolvers
- `src/graphql/context.js` - Authentication context

**Benefits**:
- ✅ Flexible queries (client requests only needed data)
- ✅ Single endpoint for all operations
- ✅ Type-safe API
- ✅ Can be stitched with API Gateway

---

### 5. REST API ✅

**Status**: ✅ **FULLY IMPLEMENTED**

**Implementation**:
- Express.js REST endpoints
- Swagger documentation
- Full CRUD operations
- Schedule management endpoints

**Endpoint**: `http://localhost:3004/api/doctors`

**Features**:
- Complete REST API with Swagger UI
- All CRUD operations
- Authentication and RBAC
- Input validation

---

## Architecture & Flow

### Write Operation Flow (CQRS + Event-Driven)

```
1. Client Request → REST/GraphQL
2. Service Method (e.g., addAvailabilitySlot)
3. Write to Doctor collection (Write Model)
4. Update DoctorScheduleReadView (Read Model) ← CQRS
5. Publish Event to Kafka ← Event-Driven
6. Return Response
```

### Read Operation Flow (CQRS)

```
1. Client Request → REST/GraphQL (with availability filters)
2. Service Method (e.g., getAvailableDoctors)
3. Query DoctorScheduleReadView (Read Model) ← CQRS
4. Fast indexed query
5. Return Response
```

### Event Consumption Flow

```
1. Doctor Service publishes event
2. Kafka topic: doctor-events
3. Other services consume events:
   - Appointment Service → Update availability
   - Notification Service → Send notifications
   - Audit Service → Log activities
```

### CQRS Flow Details

1. **Write Operation** (e.g., add availability slot):
   - Write to `Doctor` collection (write model)
   - Update `DoctorScheduleReadView` collection (read model)
   - Publish event to Kafka

2. **Read Operation** (e.g., get available doctors):
   - Query `DoctorScheduleReadView` collection (optimized)
   - Fast text search, indexed queries
   - Filter by date, time, specialization

3. **Benefits**:
   - Read queries are faster (denormalized, indexed)
   - Write operations don't block reads
   - Can scale reads independently

---

## Testing Examples

### Prerequisites

1. Auth Service must be running on port 3001
2. You need a valid JWT token from Auth Service
3. MongoDB must be running
4. Kafka should be running (optional, service degrades gracefully)

### Get Authentication Token

First, login to Auth Service to get a JWT token:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor.smith@smartclinic.com",
    "password": "Doctor123"
  }'
```

Save the `accessToken` from the response.

### Health Check

```bash
curl http://localhost:3004/health
```

### Test REST API

**Create a Doctor:**
```bash
curl -X POST http://localhost:3004/api/doctors \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "firstName": "Dr. John",
    "lastName": "Doe",
    "email": "john.doe@smartclinic.com",
    "specializations": ["cardiology"],
    "qualifications": [{
      "degree": "MD",
      "institution": "Harvard Medical School",
      "year": 2010
    }]
  }'
```

**Get My Profile:**
```bash
curl http://localhost:3004/api/doctors/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Get Available Doctors:**
```bash
curl "http://localhost:3004/api/doctors/available?date=2024-01-15&specialization=cardiology" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Add Availability Slot:**
```bash
curl -X POST http://localhost:3004/api/doctors/{id}/availability \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "date": "2024-01-15",
    "startTime": "09:00",
    "endTime": "10:00"
  }'
```

### Test GraphQL API

**Query Available Doctors:**
```graphql
query {
  availableDoctors(
    date: "2024-01-15"
    startTime: "09:00"
    endTime: "10:00"
    specialization: "cardiology"
  ) {
    id
    fullName
    email
    specializations
    nextAvailableSlot {
      date
      startTime
      endTime
    }
  }
}
```

**Mutation - Add Specialization:**
```graphql
mutation {
  addSpecialization(
    id: "doctor-id"
    specialization: "preventive care"
  ) {
    id
    specializations
  }
}
```

---

## Project Structure

```
doctor-service/
├── src/
│   ├── config/
│   │   ├── index.js          # Configuration management
│   │   ├── database.js       # MongoDB connection
│   │   └── swagger.js         # Swagger documentation
│   ├── controllers/
│   │   └── doctor.controller.js
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   ├── rbac.middleware.js
│   │   ├── validator.middleware.js
│   │   └── error.middleware.js
│   ├── models/
│   │   ├── Doctor.js         # Write model
│   │   └── DoctorScheduleReadView.js # Read model (CQRS)
│   ├── routes/
│   │   ├── doctor.routes.js
│   │   └── health.routes.js
│   ├── services/
│   │   └── doctor.service.js
│   ├── graphql/
│   │   ├── schema.js          # GraphQL schema
│   │   ├── resolvers.js       # GraphQL resolvers
│   │   └── context.js         # GraphQL context
│   ├── utils/
│   │   ├── auth.js            # Auth Service integration
│   │   ├── logger.js          # Winston logger
│   │   ├── errors.js          # Custom errors
│   │   └── eventProducer.js   # Kafka producer
│   ├── scripts/
│   │   └── seed.js            # Database seeding
│   └── index.js               # Application entry point
├── package.json
├── Dockerfile
├── .env.example
└── README.md
```

---

## Integration Details

### Integration with Auth Service

- Validates JWT tokens
- Extracts user information
- Enforces RBAC based on roles

### Integration with Appointment Service

- Appointment Service queries available doctors
- Updates slot status when appointments are booked
- Receives schedule update events

### Integration with Notification Service

- Notification Service consumes doctor events
- Sends notifications on schedule changes
- Notifies patients of doctor availability

### Integration with Audit Service

- Audit Service consumes all doctor events
- Logs all doctor activities
- Maintains compliance records

---

## Troubleshooting

### Service Won't Start

- Check MongoDB connection
- Verify Auth Service is running
- Check port 3004 is available
- Review logs in `logs/error.log`

### Authentication Fails

- Verify Auth Service URL is correct
- Check JWT token is valid
- Ensure Auth Service is accessible

### CQRS Read View Not Updating

- Check if write operations are completing
- Verify `DoctorScheduleReadView.updateFromDoctor()` is called
- Check MongoDB connection

### Events Not Publishing

- Check Kafka is running
- Verify Kafka brokers configuration
- Review Kafka producer logs
- Service continues without Kafka (graceful degradation)

### Availability Queries Slow

- Ensure indexes are created
- Use read view for availability queries
- Check MongoDB performance

---

## Next Steps

### Recommended Enhancements

1. **gRPC Implementation**
   - Add gRPC server for high-performance availability checks
   - Use Protocol Buffers for efficient communication
   - Primary communication for Appointment Service

2. **Service Discovery**
   - Integrate with Consul or Kubernetes Service Discovery
   - Dynamic service location
   - Load balancing

3. **Circuit Breaker**
   - Add circuit breaker for external service calls
   - Prevent cascading failures
   - Graceful degradation

4. **Caching**
   - Add Redis caching for frequently accessed doctors
   - Cache availability queries
   - Improve response times

5. **Advanced Scheduling**
   - Recurring appointment slots
   - Holiday handling
   - Time zone support

6. **Analytics**
   - Doctor availability analytics
   - Schedule utilization metrics
   - Performance dashboards

---

## Design Patterns Summary

### Patterns Implemented

| Pattern | Status | Implementation |
|---------|--------|---------------|
| Database per Service | ✅ | Separate MongoDB database |
| CQRS | ✅ | DoctorScheduleReadView for reads |
| Event-Driven | ✅ | Kafka event publishing |
| API Gateway | ✅ | Via API Gateway service |
| GraphQL | ✅ | Apollo Server |
| REST API | ✅ | Express.js |

### Patterns Recommended (Future)

| Pattern | Priority | Use Case |
|---------|----------|----------|
| gRPC | High | High-performance availability checks |
| Service Discovery | High | Dynamic service location |
| Circuit Breaker | Medium | Resilience for external calls |
| Caching | Medium | Performance optimization |
| Saga Pattern | Low | Multi-service transactions |

---

**Note**: This service is designed to work seamlessly with the Appointment Service for booking management and integrates with the API Gateway for unified access.

