# CMG Portal - Digital Agency Management System

## Overview

CMG Portal is a comprehensive digital agency management platform built for handling client relationships, project management, digital audits, and reporting. The system supports multiple user roles across different company types (owner, partner, client, sub) with granular permission controls and access management.

The application facilitates collaboration between digital agencies and their clients, providing tools for project tracking, audit delivery, report generation, and user management with role-based access controls.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state management and caching
- **UI Framework**: Radix UI components with Tailwind CSS and shadcn/ui design system
- **Authentication**: Context-based auth state management with JWT tokens
- **Forms**: React Hook Form with Zod validation

The frontend follows a component-based architecture with clear separation between pages, components, and business logic. Custom hooks abstract common functionality, and TypeScript provides type safety throughout the application.

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: JWT-based authentication with bcrypt password hashing
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful API endpoints with service layer architecture

The backend implements a layered architecture with clear separation between routes, services, middleware, and data access. Services encapsulate business logic while the storage layer handles all database operations.

### Database Design
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Management**: Drizzle Kit for migrations and schema evolution
- **Connection**: Neon Database serverless PostgreSQL
- **Key Entities**:
  - Companies (hierarchical with owner/partner/client/sub types)
  - Users (role-based with company associations)
  - Projects (client-specific with team access controls)
  - Digital Audits (versioned with approval workflows)
  - Access Requests (approval-based user onboarding)

The database schema supports multi-tenancy through company hierarchies and implements comprehensive role-based access control.

### Authentication & Authorization
- **Authentication Method**: JWT tokens with 7-day expiration
- **Password Security**: bcrypt hashing with salt rounds
- **Role-Based Access**: Granular permissions based on user roles and company types
- **Session Management**: Secure session storage with PostgreSQL backend
- **Access Control**: Route-level and component-level permission checks

The system implements a sophisticated permission model supporting different user roles across company hierarchies with fine-grained access controls.

### State Management & Caching
- **Client State**: React Context for authentication state
- **Server State**: TanStack React Query with intelligent caching
- **Cache Strategy**: Stale-while-revalidate with background updates
- **Optimistic Updates**: Immediate UI updates with rollback on errors
- **Cache Invalidation**: Strategic invalidation based on data relationships

The caching strategy optimizes performance while maintaining data consistency across the application.

## External Dependencies

### Core Infrastructure
- **Database**: Neon Database (serverless PostgreSQL)
- **Build Tool**: Vite with React plugin and runtime error overlay
- **Development**: Replit-specific tooling for cloud development environment

### Authentication & Security
- **JWT Library**: jose for JWT creation and verification
- **Password Hashing**: bcrypt for secure password storage
- **Session Store**: connect-pg-simple for PostgreSQL session management

### UI & Styling
- **Component Library**: Radix UI primitives for accessible components
- **Styling**: Tailwind CSS with custom design tokens
- **Icons**: Lucide React for consistent iconography
- **Fonts**: Google Fonts integration (Architects Daughter, DM Sans, Fira Code, Geist Mono)

### Data Management
- **ORM**: Drizzle ORM with PostgreSQL adapter
- **Validation**: Zod for runtime type validation and schema generation
- **Form Management**: React Hook Form with Hookform Resolvers
- **Date Handling**: date-fns for date manipulation and formatting

### Development Tools
- **TypeScript**: Full type safety across frontend and backend
- **ESLint**: Code quality and consistency
- **PostCSS**: CSS processing with Tailwind and Autoprefixer
- **Path Aliases**: Clean import paths with TypeScript path mapping

The system leverages modern web development tools and practices to ensure maintainability, performance, and developer experience.