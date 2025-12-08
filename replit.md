# Overview

This is a personal fitness training tracker application (Персональный тренировочный трекер) designed to help users plan, log, and analyze their workout routines. The application features a data-driven approach to training with AI-powered coaching, progressive overload tracking, and sophisticated volume calculations based on individual recovery capacity and training goals.

Key capabilities include: user authentication, data synchronization, personalized workout programming, comprehensive workout logging, progress visualization, AI coaching with multiple personas, body composition and female cycle tracking, custom exercise creation, and an admin panel. The application aims to provide a sophisticated, personalized fitness experience with a focus on data-driven progress and intelligent guidance.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18+ with TypeScript, using Vite.
**UI Framework**: Shadcn UI components built on Radix UI with Tailwind CSS.
**State Management**: TanStack Query for server state, local React state, LocalStorage for persistence.
**Design System**: Dark-first design, muscle group color coding, custom female cycle palette, Russian language UI, pixel-perfect design.
**Data Visualization**: Recharts for progress graphs and analytics.
**Routing**: Single-page application with view-based navigation.
**Key UI Components**: Apple-style UserMenu, ProfileView for recovery factors, OptimizedImage for lazy loading, MuscleDetailModal with Russian declension, ThemeProvider for dark/light/system modes.
**Mobile Optimization**: Safe-area CSS, touch-target sizing, responsive layouts, 2-column grids for exercise logging, bottom navigation with labels, fade-in animations.
**UX Improvements**: Haptic feedback, pull-to-refresh, skeleton loading, RestTimer modal, offline mode support with localStorage caching and indicators.
**New Features**: Workout template save/load functionality, Instagram-style "Weekly Stories" for progress summaries, editable workout history, enhanced tooltips.

## Backend Architecture

**Server Framework**: Express.js on Node.js.
**API Design**: RESTful API with JSON payloads for user data, workouts, body logs, AI coach, exercises, admin functions, and object storage.
**Storage Strategy**: PostgreSQL database with Drizzle ORM for all user and application data, scoped by userId. Session storage via connect-pg-simple.
**AI Integration**: OpenAI API for AI coaching with multiple specialized personas.

## Data Models

**Core Entities**: UserProfile (gender, goals, recovery factors, female cycle data), Workout (date, exercises with sets/reps/weight), BodyLog (weight, body fat), Exercise (pre-defined and custom), CalculatedProgram (dynamic training volume recommendations).
**Business Logic**: Advanced volume calculation algorithms considering user profile, recovery factors, and goals. Progressive overload tracking, muscle group balancing, and female cycle phase integration for training recommendations.

## Key Architectural Decisions

**Monorepo Structure**: Shared types between client and server for type safety and easier refactoring.
**Client-Side Training Calculations**: Complex volume calculations performed in the frontend for instant feedback and reduced server load.
**Component-Based View Architecture**: Large view components for simpler state management and faster transitions.
**AI Coaching System**: Multiple specialized coach personas for targeted advice and better user experience.
**Exercise Database Strategy**: Exercises stored in PostgreSQL with a static fallback for robustness and admin panel management.

# External Dependencies

**@neondatabase/serverless**: PostgreSQL client for Neon.
**drizzle-orm**: TypeScript ORM for SQL databases.
**OpenAI SDK**: Official OpenAI API client for AI coaching.
**Recharts**: Composable charting library for data visualization.
**Radix UI**: Headless UI component library for accessible primitives.
**Tailwind CSS**: Utility-first CSS framework for styling.
**@tanstack/react-query**: Server state management for API data fetching and caching.
**react-hook-form**: Form state management.
**zod**: Schema validation library.
**Vite**: Build tool and dev server.
**esbuild**: JavaScript bundler for server-side code.
**TypeScript**: Static type checking.
**express-session**: Session middleware.
**connect-pg-simple**: PostgreSQL session store.
**date-fns**: Date utility library.