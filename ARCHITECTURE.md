# Finance Onboarding App - Architecture Documentation

## Overview
The Finance Onboarding App is a full-stack web application designed to streamline the client onboarding process for financial institutions. It features a modern React frontend, FastAPI backend, and uses multiple databases for different aspects of data storage.

## System Architecture

### 1. Frontend (React + Vite)
Located in `/frontend`, built with modern React and Vite.

#### Key Components:
- **Technology Stack:**
  - React 18
  - Vite 6
  - TailwindCSS
  - ShadcnUI Components
  - Zustand (State Management)
  - React Router DOM
  - React Hook Form with Zod validation

#### Directory Structure:
```
frontend/
├── src/
│   ├── Pages/
│   │   └── Onboard_Forms/    # Client onboarding form components
│   ├── components/
│   │   ├── ui/              # Reusable UI components (ShadcnUI)
│   │   └── ...             # Custom components
│   ├── store/              # Zustand state management
│   ├── utils/              # Utility functions
│   └── lib/                # Shared libraries and configurations
```

### 2. Backend (FastAPI)
Located in `/backend`, built with FastAPI and SQLAlchemy.

#### Key Components:
- **Technology Stack:**
  - FastAPI
  - SQLAlchemy (ORM)
  - Alembic (Database Migrations)
  - Pydantic (Data Validation)
  - JWT Authentication
  - ML Risk Scoring System

#### Directory Structure:
```
backend/
├── routes/           # API route handlers
├── models/           # SQLAlchemy models
├── ml/              # Machine Learning risk scoring system
├── migrations/       # Alembic database migrations
└── utils/           # Utility functions
```

### 3. Database Architecture

#### PostgreSQL
- Primary database for structured data
- Stores:
  - User accounts
  - Client information
  - Onboarding applications
  - Form progress
  - Risk assessments

#### MongoDB
- Document store for unstructured data
- Stores:
  - Detailed form submissions
  - Document metadata
  - Audit logs

#### MinIO
- Object storage for files and documents
- Stores:
  - Uploaded client documents
  - Generated reports
  - Supporting documentation

## Key Features

### 1. Client Onboarding Process
- Multi-step form workflow
- Progress tracking and save functionality
- Document upload and verification
- KYC (Know Your Customer) verification

### 2. Risk Assessment
- ML-based risk scoring system
- Rule-based fallback system
- Real-time risk evaluation
- Risk factor identification and reporting

### 3. Security Features
- JWT-based authentication
- Role-based access control
- Secure file storage
- Data encryption
- Audit logging

## Infrastructure

### Docker Containerization
The application is containerized using Docker with separate containers for:
- Frontend (React)
- Backend (FastAPI)
- PostgreSQL
- MongoDB
- MinIO
- PGAdmin (Database Management)

### Development Environment
```yaml
services:
  frontend:    # React application
  backend:     # FastAPI service
  postgres:    # Main database
  mongodb:     # Document store
  minio:       # Object storage
  pgadmin:     # Database management
```

## API Structure

### Main Endpoints:
1. Authentication
   - `/api/auth/login`
   - `/api/auth/register`
   - `/api/auth/refresh`

2. Onboarding
   - `/api/onboarding/application`
   - `/api/onboarding/progress`
   - `/api/onboarding/documents`

3. Risk Assessment
   - `/api/risk/score`
   - `/api/risk/factors`
   - `/api/risk/history`

4. Document Management
   - `/api/documents/upload`
   - `/api/documents/download`
   - `/api/documents/verify`

## Testing

### Frontend Testing
- Cypress for E2E testing
- React Testing Library for component tests
- Jest for unit tests

### Backend Testing
- PyTest for unit and integration tests
- Coverage reporting
- API endpoint testing

## Deployment
- Docker Compose for local development
- Production-ready containerization
- Environment-specific configurations
- Database migration support

## Security Considerations
1. Authentication and Authorization
   - JWT token-based authentication
   - Role-based access control
   - Token refresh mechanism

2. Data Security
   - Encrypted data storage
   - Secure file handling
   - Input validation
   - XSS protection
   - CSRF protection

3. API Security
   - Rate limiting
   - Request validation
   - Error handling
   - Audit logging

## Best Practices
1. Code Organization
   - Modular architecture
   - Separation of concerns
   - Clean code principles
   - Type safety

2. Performance
   - Optimized database queries
   - Caching strategies
   - Lazy loading
   - Efficient state management

3. Maintenance
   - Comprehensive documentation
   - Code comments
   - Version control
   - Dependency management
