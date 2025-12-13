# API Gateway - Smart Clinic

Enterprise-level API Gateway for Smart Clinic microservices platform. 
Provides unified enrtry point with GraphQL schema stitching.. REST API proxying, authentication, rate limiting, circuit breaker, and more.


## Architecture
The API Gateway serves as the single entry poiunt for all client request and provides
- **GraphQL Gateway** : Schema stitching from multiple services
- **REST API Proxy**: Routes request to appropriate microservices
- **Authentication & Authorization**: JWT token validation
- **Rate Limiting**: Protectinbg APIs from abuse
- **Circuit Breaker**: Prevents cascading failures
- **Request Aggregation**: Combines multiple service calls
- ***Cirrelation ID tracking*: Distributed tracing support
- **Caching**: Reponse caching for improved performance


## Features

### Core Features

- **GRaphQL schema Stitching**
- **REST API Proxy**
- **Autrhentication and Authroization**
- **Rate Limiting**
- **Circuit Breaker**
- **Request Aggregation**
- **Correlation ID Tracking**
- **Caching**


----


## Implementation Steps

### Phase 1: Project Setup

#### Step 1.1: Initialize Project
```bash
makdir gateway
cd gateway
npm init -y
```

#### Step 1.2: Install Core Dependencies
```bash
# Express and core dependenices
npm install express cors helmet dotenv express-async-errors compression

# GraphQL
npm install apollo-server-express graphql 
npm install @graphql-tools/schema @graphql-tools/stitch @graphql-tools/merge
npm install @graphql-tools/wrap @graphql-tools/load-files
npm install cross-fetch

# HTTP Proxy
npm install http-proxy-middleware axios

# Rate limiting
npm install express-rate-limit

# Circuit Breaker
npm install opossum

# Caching
npm install node-cache

# Utilities
npm install uuid winston

# Development dependenices
npm install --save-dev nodemon jest eslint
```

#### Step 1.3: Create Project Structure
```bash
mkdir -p src/{config,middleware,routes,services,graphql,utils}
mkrir -p logs
```

#### Step 1.4: Create Configuration Files
- Create `.env.example` file with all envirnment variables
- Create `src/config/index.js` for centralized configuration management
- Configure service URLs, timeouts, rate limits, circuit breaker settings

----

### Phase 2: Core Utilities



