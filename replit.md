# Overview

This is a personal fitness training tracker application (Персональный тренировочный трекер) designed to help users plan, log, and analyze their workout routines. The application features a data-driven approach to training with AI-powered coaching, progressive overload tracking, and sophisticated volume calculations based on individual recovery capacity and training goals.

Key features:
- User authentication via Replit Auth (Google, GitHub, email/password)
- Data synchronization across devices via PostgreSQL database
- Personalized workout programming based on user profile (experience, sleep, stress, nutrition)
- Workout logging with comprehensive exercise database
- Progress tracking with visualizations across muscle groups
- AI coaching system with multiple coach personas
- Body composition tracking
- Female cycle tracking integration
- Russian language interface

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18+ with TypeScript, using Vite as the build tool

**UI Framework**: Shadcn UI components built on Radix UI primitives with Tailwind CSS for styling

**State Management**:
- TanStack Query (React Query) for server state management and caching
- Local React state (useState) for component-level state
- LocalStorage for persisting chat history and user preferences

**Design System**:
- Dark-first design with deep backgrounds (#0A0E1A, #111827)
- Muscle group color coding system (7 distinct colors for legs, back, chest, shoulders, arms, abs, cardio)
- Custom color palette for female cycle phases
- Russian language throughout the UI
- Pixel-perfect recreation based on design guidelines

**Data Visualization**: Recharts library for area charts, progress graphs, and workout analytics

**Routing**: Single-page application with view-based navigation (dashboard, log, progress, coach, history)

## Backend Architecture

**Server Framework**: Express.js running on Node.js

**API Design**: RESTful API with JSON payloads
- GET /api/user - Fetch user profile
- POST /api/user - Save/update user profile
- GET /api/workouts - Fetch all workouts
- GET /api/workouts/:id - Fetch specific workout
- POST /api/workouts - Create new workout
- PUT /api/workouts/:id - Update workout
- DELETE /api/workouts/:id - Delete workout
- GET /api/body-logs - Fetch body composition logs
- POST /api/body-logs - Create body log
- DELETE /api/body-logs/:id - Delete body log
- POST /api/coach/chat - AI coach chat endpoint

**Storage Strategy**: 
- PostgreSQL database with Drizzle ORM (DatabaseStorage class)
- All user data (profiles, workouts, body logs) scoped by userId with foreign key constraints
- Session storage via connect-pg-simple for authentication persistence

**AI Integration**: OpenAI API for AI coaching system with multiple coach personas (training, nutrition, motivation, recovery)

## Data Models

**Core Entities**:

1. **UserProfile**: Gender, age, weight, experience, training days, goals (hypertrophy/strength/endurance), priority muscles, recovery factors (sleep, stress, calories), female cycle data

2. **Workout**: Date, list of exercises with sets/reps/weight data, duration, notes

3. **BodyLog**: Weight, body fat percentage, timestamp for tracking body composition over time

4. **Exercise**: Pre-defined database of 100+ exercises categorized by muscle group (compound/isolation), with technique descriptions

5. **CalculatedProgram**: Dynamically computed training volume recommendations (MRV/MEV) based on user profile and recovery capacity

**Business Logic**:
- Volume calculation algorithm considers experience level, recovery factors (sleep, stress, nutrition, age), gender-specific bias factors, and goal-specific volume modifiers
- Progressive overload tracking per exercise
- Muscle group distribution balancing based on user priorities
- Female cycle phase integration for training recommendations

## Key Architectural Decisions

### Monorepo Structure
**Decision**: Single repository with shared types between client and server
**Rationale**: Type safety across the stack, easier refactoring, single source of truth for data models
**Implementation**: TypeScript with path aliases (@/, @shared/)

### In-Memory Storage with Database-Ready Interface
**Decision**: Start with in-memory storage, use interface abstraction for future database migration
**Rationale**: Rapid prototyping and development, easy testing, clear migration path
**Trade-offs**: Data persistence requires database migration, current state lost on server restart
**Migration Path**: IStorage interface allows swapping MemStorage for database implementation without changing business logic

### Client-Side Training Calculations
**Decision**: Complex volume calculations performed in frontend
**Rationale**: Instant feedback, reduced server load, offline capability potential
**Location**: lib/training.ts contains all training program algorithms

### Component-Based View Architecture
**Decision**: Large view components (Dashboard, WorkoutLogger, Progress, CoachView) rather than page routing
**Rationale**: Simpler state management, faster transitions, mobile-first experience
**Trade-offs**: No deep linking to specific views (could be added with hash routing)

### AI Coaching System
**Decision**: Multiple specialized coach personas rather than single general assistant
**Rationale**: More targeted advice, clearer context for AI, better user experience
**Implementation**: OpenAI API with system prompts per coach type, chat history stored client-side

### Exercise Database Strategy
**Decision**: Static, comprehensive exercise database in code (100+ exercises)
**Rationale**: No database needed for static data, type-safe, fast lookups
**Location**: lib/exercises.ts with categorization by muscle group and exercise type

# External Dependencies

## Core Dependencies

**@neondatabase/serverless**: PostgreSQL client for Neon (serverless Postgres)
- Purpose: Database connectivity (configured but not actively used with current in-memory storage)

**drizzle-orm**: TypeScript ORM for SQL databases
- Purpose: Database schema definition and query building
- Configuration: drizzle.config.ts pointing to shared/schema.ts

**OpenAI SDK**: Official OpenAI API client
- Purpose: AI coaching chat functionality
- Configuration: Uses AI_INTEGRATIONS_OPENAI_API_KEY and AI_INTEGRATIONS_OPENAI_BASE_URL environment variables

## UI & Visualization

**Recharts**: Composable charting library
- Purpose: Area charts for progress tracking, body composition graphs, volume distribution visualization

**Radix UI**: Headless UI component library
- Purpose: Accessible primitives for dialogs, dropdowns, tooltips, accordions, etc.
- Implementation: Wrapped by Shadcn UI components

**Tailwind CSS**: Utility-first CSS framework
- Purpose: Styling system with custom design tokens
- Configuration: Custom color palette for muscle groups and themes

**class-variance-authority**: CSS class composition utility
- Purpose: Component variant management (button styles, card variants)

**cmdk**: Command palette component
- Purpose: Search and command functionality

## State & Data Management

**@tanstack/react-query**: Server state management
- Purpose: API data fetching, caching, and synchronization
- Configuration: queryClient with custom error handling and retry logic

**react-hook-form**: Form state management
- Purpose: Onboarding forms, settings, workout logging forms

**zod**: Schema validation library
- Purpose: Runtime type validation, form validation
- Integration: Used with Drizzle for database schemas

## Development & Build

**Vite**: Build tool and dev server
- Purpose: Fast development experience, optimized production builds
- Plugins: React, runtime error overlay, Replit-specific development tools

**esbuild**: JavaScript bundler
- Purpose: Server-side code bundling for production

**TypeScript**: Static type checking
- Purpose: Type safety across entire codebase

## Session & Storage

**express-session**: Session middleware
- Purpose: User session management (configured but minimal usage with current in-memory approach)

**connect-pg-simple**: PostgreSQL session store
- Purpose: Session persistence to database (ready for when database is integrated)

## Date & Time

**date-fns**: Date utility library
- Purpose: Date formatting, calculations for workout history and cycle tracking

## Notes

- Database (PostgreSQL via Neon) is actively used with full data persistence
- User authentication via Replit Auth with session management (7-day TTL)
- All API routes protected with isAuthenticated middleware
- AI integration requires OpenAI API key via environment variables
- Application is Russian-language focused with all UI text in Russian
- Design follows strict color palette for muscle groups (defined in MUSCLE_GROUPS constant)