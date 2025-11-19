# Patient Service

## Features

### Core Features

- Patient CRUD Operation
- Medical history tracking
- Current medication tracking
- Emergency contact information
- Insurance information management
- MongoDB database integration
- Integration with auth service for authentication
- Role-based access control (RBAC)
- Input validation
- Error Handling
- Request Logger
- SWagger


# Advanced Pattern Implementaion
- Database per service - isolate patient dataabse
- CQRS (Command Query Responsibility Segregation) - Seprarate read-optimized views for fast queries
- Event-Driven Architectire - Kafka integration for publishing patient events
- GraphQL API - Flexible GraphQL endpoints with apollo server
- REST API - Full REST endpoints with swagger documentaion