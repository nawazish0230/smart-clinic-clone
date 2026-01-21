# Auth Service

### Authentication and Authrorization microservice for smart clinic platform


## Features
- JWT-based authentication (access token + refresh token)
- User registration and login
- Role-Baserd Access Control (RBAC)
- Password hasing with bcrpt
- MOngoDB database integration
- Input validation
- Error handling
- Request logging
- Swagger UI API documentation


## User Roles
- `patient` - Default role for patients
- `doctor` - Healthcare provider
- `clinician` - Clinical staff
- `admin` - System adminstrator

# User Schema
### Well Structure
This makes it robust persistence layer

- Schema-level validation
- Password hashing hook
- Roles and Status enaum
- Indexes
- selective fields
- JSON transformation
- instance methods

