# Noema - AI Data Analysis Platform

## Overview

Noema is an AI-powered data analysis platform that transforms spreadsheets and datasets into actionable intelligence. Users can upload CSV files, and the system uses AI to generate professional visualizations, discover patterns, and produce insights automatically.

The application follows a full-stack TypeScript architecture with a React frontend and Express backend, using PostgreSQL for data persistence and Replit Auth for user authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query for server state, React hooks for local state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables
- **Charts**: Recharts library for data visualization
- **Animations**: GSAP with ScrollTrigger for scroll-based animations, Framer Motion for UI transitions
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful endpoints defined in shared route contracts
- **File Handling**: Multer for multipart form data uploads (5MB limit)
- **Session Management**: Express sessions with PostgreSQL storage via connect-pg-simple

### Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod for type-safe schemas
- **Database**: PostgreSQL (connection via DATABASE_URL environment variable)
- **Migrations**: Drizzle Kit for schema migrations (`npm run db:push`)

### Authentication
- **Provider**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL sessions table
- **User Management**: Automatic user upsert on authentication

### Key Design Patterns
1. **Shared Type Contracts**: Route definitions and schemas in `/shared` folder ensure type safety between frontend and backend
2. **Storage Abstraction**: `IStorage` interface allows for different storage implementations
3. **Modular Integrations**: Replit integrations (auth, chat, audio, image, batch) are organized in separate modules under `server/replit_integrations/`

## External Dependencies

### Database
- PostgreSQL database (provisioned via Replit)
- Required environment variable: `DATABASE_URL`

### AI Services
- OpenAI API via Replit AI Integrations
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`
- Used for: Data analysis, image generation, voice processing

### Authentication
- Replit OpenID Connect provider
- Environment variables: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### Third-Party Libraries
- **UI**: Radix UI primitives, Lucide React icons
- **Data Viz**: Recharts
- **Animation**: GSAP, Framer Motion
- **Forms**: React Hook Form with Zod resolver
- **Date Handling**: date-fns

## Recent Changes (February 2026)

### Ultra-Professional Dashboard Redesign
- Redesigned entire dashboard with professional typography (Inter font), refined color palette, and sleek aesthetic
- Built professional sidebar navigation with recent analyses list and user profile section
- Created tabbed interface (Overview, Insights, Data, Ask AI) in analysis detail page

### AI Chat for Data Exploration
- Added AI chat panel for conversational data exploration with streaming responses
- Uses SSE endpoint at `/api/chat/data-analysis` with OpenAI gpt-4o model
- Includes conversation context and analysis summary for informed responses

### Custom Chart Builder
- Built chart builder allowing users to create custom visualizations
- Users select chart type (bar, line, area, pie) and data columns
- Real-time preview before adding charts to dashboard

### Export Functionality
- Added export dropdown menu with Report (.txt) and CSV data export options
- Professional data table view displaying parsed CSV data with headers

### Key Components
- `Layout.tsx` - Professional sidebar layout with navigation and user profile
- `ChartBuilder.tsx` - Custom chart creation with column selection
- `DataChat.tsx` - AI chat interface for data questions
- `ChartRenderer.tsx` - Renders various chart types with gradient styling
- `ExportMenu.tsx` - Export dropdown for reports and data
- `AnalysisDetail.tsx` - Main analysis page with tabbed interface