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
- `DataChat.tsx` - AI chat with suggestions, source indicators, and confidence levels
- `ChartRenderer.tsx` - Vibrant gradient chart styling
- `ExportMenu.tsx` - Export dropdown for reports and data
- `AnalysisDetail.tsx` - Tabbed interface with professional data tables and dataset summary
- `MetricCard.tsx` - Metric display with uppercase labels
- `FileUpload.tsx` - Animated upload zone with privacy notice and status feedback
- `InsightCard.tsx` - Categorized insight display with "Why this matters" context
- `DatasetSummary.tsx` - Dataset overview with row/column counts, data types, quality flags

### Professional Polish Enhancements (February 2026)
- **Insight Presentation**: Insights grouped into categories (Key Findings, Trends, Anomalies, Data Quality Notes) with importance ranking and "Why this matters" explanations
- **Dataset Summary Card**: Row/column counts, detected data types, missing data percentage, quality flags for high missingness, constant columns, duplicate rows
- **AI Chat Enhancements**: Context-aware suggested prompts, data source indicators showing which columns were used, confidence level indicator (high/medium/low)
- **Trust Signals**: Privacy notice near file upload ("Your data is processed securely and not used for AI training"), descriptive loading states
- **Sleek Minimal Homepage**: Flat design with no gradients/shadows, horizontal stats row, side-by-side quick links, clean recent activity list

### Projects Feature (February 2026)
- **Projects**: Users can group multiple analyses together into projects for cross-cutting analysis
- **Database**: projects table with userId, name, description, summary, insights (JSONB), createdAt, updatedAt; project_analyses junction table for many-to-many relationship
- **AI Cross-Analysis Insights**: When a project has 2+ analyses, AI generates insights connecting patterns across datasets that wouldn't be visible individually
- **Key Components**:
  - `ProjectsPage.tsx` - Lists all user projects with descriptions and analysis counts
  - `ProjectDetail.tsx` - Shows project summary, AI insights, and contained analyses with add/remove capabilities
  - `AddToProjectModal.tsx` - Modal for adding analyses to existing or new projects
  - `use-projects.ts` - TanStack Query hooks for project CRUD operations
- **Navigation**: Projects tab added to sidebar between Analyses and Files
- **Analyses Page**: 3-dot menu on each analysis card with "Add to Project" and "Delete" options

### Advanced Visualization Components (February 2026)
Inspired by hal9ai/awesome-dataviz, the following visualization components have been added:

- **Chart Types in ChartRenderer**:
  - `bar` - Vertical bar charts with blue gradient
  - `line` - Line charts with blue to indigo gradient
  - `area` - Area charts with gradient fill
  - `pie` - Animated donut charts with blue-purple spectrum
  - `horizontal_bar` - Horizontal bar charts
  - `scatter` - Scatter plots for correlation analysis
  - `radar` - Radar/spider charts for multi-dimensional comparisons
  - `composed` - Combined bar and line charts for multi-metric analysis

- **Sparkline Components** (`Sparkline.tsx`):
  - `Sparkline` - Compact line sparklines with trend detection
  - `SparkBar` - Compact bar sparklines with trend coloring

- **Matrix/Heatmap Components** (`CorrelationMatrix.tsx`):
  - `CorrelationMatrix` - Shows correlations between variables with diverging color scale
  - `Heatmap` - General purpose heatmap for activity/density visualization

- **Stat Components** (`StatCard.tsx`):
  - `StatCard` - Metric card with sparkline trend visualization
  - `ProgressStat` - Progress bar with labels and percentage
  - `Gauge` - Semi-circular gauge for progress/performance indicators

- **Visualization Showcase Page** (`/visualizations`):
  - Demonstrates all available chart types and components
  - Interactive examples with sample data
  - Accessible via "Charts" link in sidebar navigation