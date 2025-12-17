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

#### Step 2.1: Create Logger Utitity
Create 'src/utils/logger.js`:
- Configure winston logger
- Setup file transport (combined.log, error.logs)
- Configure log format (JSON for production, simple for development)
- Add execution and rejection handlers

#### Step 2.2: Create Error Classes
Create `src/utils/errors.js`:
- `AppError` - Base error class
- `ValidationError` - 400 error
- `AuthenticationError` - 401 error
- `AuthorizationError` - 403 error
- `NotFoundError` - 404 error
- `ServiceUnavaliableError` - 503 error
- `TimeoutError` - 504 error
- `CircuitBreakerOpenError` - Circuit breaker error

#### Step 2.3: Create Correlation ID Utility
Create `src/utils/corrcetionId.js`
- `generateCorrelationId()` - generate UUID for request tracking
- `getCorrelationId()` - Extract from headers or generte new
- `setCorrectionId()` - Set in response headers

#### Step 2.4: Create JWT Utility
Create `src/utils/jwt.js`
- `extractTokenFromHeader()` - Extract Bearer token
- `verifyAccessToken()` - verify JWT token
- `decodeToekn()` Decode token without verification

-----

### Phase 3: Middleware Implemenation

#### Step 3.1: Create Correlation ID Middleware
Create `src/middlewares/correlationId.middleware.js`
- Extract or generate correlation Id
- Attach to request object
- Set in resopnse headers
- Must be applied early in middleware chain


#### Step 3.2: Create Logging Middleware
Create `src/middlewares/logging.middleware.js`
- Log incoming request with correlation Id
- Log response status and duration
- Include user information if authenticated
- Use approprriate log level (info, warn, error)



#### Step 3.3: Create Authentication Middleware
Create `src/middlewares/auth.middleware.js`
- `authenticate()` - Required authentication
- Extract JWT token from Authorization header
- Verify token info to request object
- Attach user info to request object
- Handle authentication error
- `optionalAuthenticate()` - Optional authentication
- try to authenticate but don;t fail of no token



#### Step 3.4: Create Rate Limiting Middleware
Create `src/middlewares/rateLimiter.middleware.js`
- `generalRateLimiter` - 100 request per minutes
- `authRatelimiter` - 5 request per 15 mints (stricter for auth)
- `graphqlRateLimiter` - 200 request per 15 mints
- Configure with express-rate-limit
- Add custom handler for rate limit exceeded



#### Step 3.5: Create Error Handling Middleware
Create `src/middlewares/error.middleware.js`:
- `notFound()` - 404 handler for unknown routes
- `errorHandler()` - Global error handleer
  - Log errors with correlation ID
  - Handle operational error (AppError Instances)
  - Handle GraphQL errors
  - Don't leak error details in production

----

### Phase 4: Service Clients & Circuit Breaker

#### Step 4.1: Create Circuit Breaker Service
Create `src/services/circuitBreaker.js`
- Use Opossum librarary
- Configure timeout, error threshold, reset timeout
- Add event handlers (open, close, halfOpen, failure, reject)
- Log circuit breaker state changes
- `createCircuitBreaker()` - Factory function
- `executeWithCircuitBreaker()` - Execute function with circuit breaker

#### Step 4.2: Create Service Client
Create `src/services/serviceClient.js`
- `ServiceClient` class for HTTP Communication
- Use Axios for HTTP requests
- Integrate circuit breaker
- Add request/response interceptors
- Forward correlation ID in headers
- Forward user information
- Implement timeout handling
- Method: `get()`, `post()`, `put()`, `delete()`, `patch()`
- `healthCheck()` - check service availablility()
- `createServiceClients()` - Factory for all services

#### Step 4.3: Create Cache Service
Create `src/services/cache.js`
- Use node-cache library
- Configure TTL and check persiod
- Method: `get()`, `set()`, `del()`, `flush()`, `getStats()`
- Add event handlers for cache operations

-----

### Phase 5: GraphQL Implementation

#### Step 5.1: Create Base GraphQL Schema
Create `src/graphql/schema.js`:
- Defibe base schema with empty Query, Mutation, Subscription
- This will be merged with remote schemas

#### Step 5.2: Create GraphQL Context
Create `src/graphql/context.js`:
- Extract JWT token from request
- Verify token and extract user info
- Add correlation ID to context
- Return context object with user and correlationId

#### Step 5.3: Create GraphQL Resolvers
Create `src/graphql/resolvers.js`:
- Factory function that accepts service clients
- Return vase resolver (can be extended)
- Will be merged with remote resolvers

#### Step 5.4: Create Schema Stitching
Create `src/graphql/stichSchemas.js`:
- `createExecute()` - Create executor for remote GraphQL service
  - Forward authorization header
  - Forward correlation ID
  - Make HTTP request to remote GraphQL endpoints
- `stichRemoteSchemas()` - Main stiching function
  - Introspect remote schemas
  - Wrap schemsa with executors
  - Stich all schema togther
  - Handle error gracefully (service continues if stiching fails)

**Example:**
```javascript
// Stiching Patient Servuce GraphQL Schema
const executor = createExecutor(patientServiceUrl, '/graphql');
const schema = await introspectSchema(executor);
const wrapperdSchema = wrapSchema({ schema, executor })
```

------

### Phase 6: REST API Proxy

#### Step 6.1: Create Proxy Configuration Factory
Create proxy configuratuon in `src/routes/proxy.routes.js`:
- `createProxyConfig()` - Factory for proxy middleware config
- Configure target, changeOrigin, pathRewrite
- Add `onProxyReq` - Forward correalation ID and user info
- Add `onProxyRes` - Log proxy responses
- Add `onError` - Handle proxy errors gracefully
- Configure timeout


#### Step 6.2: Create Proxy Routes
Create `src/routes/proxy.routes.js`:
- Auth Service proxy (`/api/auth/*`)
    - Apply auth rate limiter
    - No authentication required (for login/register)
- Patient Service proxy (`/api/patients/*`)
    - Apply authentication middleware
    - Apply general rate limiter
- Add proxies for all other services (appointment, doctors, etc)
- Use conditional routing (only if service URL configured)

**Example**
```javascript
route.use(
  '/api/patients',
  authenticate(),
  generalRateLimiter,
  createProxyMiddleware(createProxyConfig(patientServiceURL))
)
```