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

### Professional Design System Overhaul
- **Typography**: Inter font with natural weights (400-500), refined letter-spacing, proper text rendering
- **Color palette**: Warm neutral palette with 220-degree hue shift for subtle sophistication
- **Spacing**: Consistent spacing system throughout for professional appearance

### UI Component Polish
- **Sidebar**: Logo icon, refined navigation, improved user avatar section
- **Metric Cards**: Uppercase labels with wide tracking, tabular numbers for data
- **File Upload**: Clean dashed border, animated states with Framer Motion
- **Data Tables**: Professional header styling, proper row hover states

### Vibrant Chart Visualizations
- Bar charts: Indigo to purple gradient
- Line charts: Cyan to blue gradient
- Area charts: Emerald to teal with soft fill
- Horizontal bar: Amber to orange gradient
- Pie/Donut: Purple spectrum with animated segments

### AI Chat Interface
- Gradient icons (violet to purple) for AI assistant
- Suggestion chips for common questions
- Streaming responses with typing indicators
- Rounded message bubbles with proper role styling

### Key Components
- `Layout.tsx` - Professional sidebar layout with logo and navigation
- `ChartBuilder.tsx` - Custom chart creation with preview
- `DataChat.tsx` - AI chat with suggestions and streaming
- `ChartRenderer.tsx` - Vibrant gradient chart styling
- `ExportMenu.tsx` - Export dropdown for reports and data
- `AnalysisDetail.tsx` - Tabbed interface with professional data tables
- `MetricCard.tsx` - Metric display with uppercase labels
- `FileUpload.tsx` - Animated upload zone with status feedback