# 🧠 Project Context & Architecture Guide

This document provides comprehensive context about the Watch Me project for AI assistants and future development.

## 🎯 Project Overview

**Watch Me** is a full-stack personal watchlist application that allows users to track movies and TV shows they want to watch, are currently watching, or have finished. The app integrates with TMDB for rich media data and uses Supabase for authentication and database management.

## 🏗️ Architecture Decisions

### Frontend Architecture
- **Next.js 15 with App Router**: Chosen for its modern routing, server components, and excellent developer experience
- **TypeScript**: For type safety and better developer experience
- **Tailwind CSS**: For rapid UI development and consistent design system
- **Headless UI**: For accessible, unstyled components that work with Tailwind
- **Framer Motion**: For smooth animations and transitions
- **React Hook Form**: For efficient form handling with validation

### Backend & Database
- **Supabase**: Chosen over alternatives for its excellent Next.js integration, real-time features, and built-in authentication
- **PostgreSQL**: For robust data storage and complex queries
- **Prisma ORM**: For type-safe database operations and excellent developer experience
- **TMDB API**: For comprehensive movie and TV show metadata

### Authentication Strategy
- **Google OAuth**: Primary authentication method via Supabase Auth
- **Session Management**: Using Supabase SSR for server-side session handling
- **User Context**: React context for managing authentication state

## 📁 Code Organization Patterns

### Component Structure
```
components/
├── ui/                    # Generic, reusable components
│   ├── Button.tsx
│   ├── Modal.tsx
│   └── ...
├── watchlist/             # Feature-specific components
│   ├── WatchlistForm.tsx
│   ├── WatchlistItems.tsx
│   └── ...
└── layout/                # Layout components
    ├── Header.tsx
    └── ...
```

### File Naming Conventions
- **Components**: PascalCase (e.g., `WatchlistForm.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `tmdbClient.ts`)
- **Types**: PascalCase (e.g., `watchlist.ts`)

### Import Patterns
- **Absolute imports**: Using `@/` alias for `src/` directory
- **Component imports**: Import from specific files, not index files
- **Type imports**: Separate type imports from value imports

## 🔧 Development Patterns

### State Management
- **React Context**: For global state (authentication, user data)
- **Local State**: For component-specific state
- **Server State**: Using React Query patterns with fetch API
- **Form State**: React Hook Form for complex forms

### Data Flow
1. **User Action** → Component event handler
2. **API Call** → Fetch to Next.js API routes
3. **Database Operation** → Prisma client operations
4. **Response** → Update local state and UI
5. **Optimistic Updates** → Immediate UI feedback

### Error Handling
- **API Errors**: Try-catch blocks with user-friendly error messages
- **Form Validation**: React Hook Form validation with custom error messages
- **Network Errors**: Graceful fallbacks and retry mechanisms
- **Authentication Errors**: Automatic redirect to login

### Performance Optimizations
- **Dynamic Imports**: For heavy components (e.g., WatchlistItems)
- **Image Optimization**: Next.js Image component with proper sizing
- **Code Splitting**: Automatic with Next.js App Router
- **Caching**: Supabase caching and browser caching strategies

## 🎨 UI/UX Patterns

### Design System
- **Color Palette**: Blue primary, gray neutrals, semantic colors for status
- **Typography**: Inter font family with consistent sizing
- **Spacing**: Tailwind spacing scale (4px base unit)
- **Components**: Consistent border radius, shadows, and hover states

### Responsive Design
- **Mobile-First**: Design for mobile, enhance for desktop
- **Breakpoints**: Tailwind default breakpoints (sm, md, lg, xl)
- **Touch Targets**: Minimum 44px for interactive elements
- **Modal Behavior**: Bottom sheet on mobile, centered modal on desktop

### Accessibility
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **ARIA Labels**: For interactive elements
- **Keyboard Navigation**: Full keyboard support
- **Color Contrast**: WCAG AA compliant color combinations

## 🔌 API Integration Patterns

### TMDB Integration
- **Client Setup**: Singleton pattern for API client
- **Rate Limiting**: Respectful API usage with delays
- **Error Handling**: Graceful fallbacks for missing data
- **Caching**: Store frequently accessed data in database

### Supabase Integration
- **Client Setup**: SSR-compatible client configuration
- **Real-time**: Subscription patterns for live updates
- **Row Level Security**: Database-level security policies
- **Migrations**: Prisma-managed schema changes

## 🧪 Testing Strategy

### Current Testing Approach
- **Manual Testing**: Feature testing during development
- **Type Safety**: TypeScript for compile-time error catching
- **Linting**: ESLint for code quality
- **Build Testing**: Vercel preview deployments

### Future Testing Plans
- **Unit Tests**: Jest and React Testing Library
- **Integration Tests**: API route testing
- **E2E Tests**: Playwright for critical user flows
- **Visual Regression**: Component screenshot testing

## 🚀 Deployment Strategy

### Development Environment
- **Local Development**: Next.js dev server with hot reload
- **Database**: Local PostgreSQL or Supabase local development
- **Environment Variables**: `.env.local` for local configuration

### Production Environment
- **Hosting**: Vercel for Next.js deployment
- **Database**: Supabase production database
- **Environment Variables**: Vercel environment configuration
- **Domain**: Custom domain with SSL

## 📈 Performance Metrics

### Current Performance
- **Lighthouse Score**: Target 90+ across all metrics
- **Core Web Vitals**: Optimized for LCP, FID, and CLS
- **Bundle Size**: Under 500KB initial bundle
- **Load Times**: Under 2 seconds for initial page load

### Monitoring
- **Vercel Analytics**: Performance and usage metrics
- **Error Tracking**: Console error monitoring
- **User Analytics**: Basic usage patterns

## 🔮 Future Development Considerations

### Scalability
- **Database**: PostgreSQL can handle significant growth
- **Caching**: Redis for frequently accessed data
- **CDN**: Vercel Edge Network for global performance
- **Microservices**: Potential for service separation

### Feature Expansion
- **Social Features**: User sharing and recommendations
- **Mobile App**: React Native or PWA approach
- **Offline Support**: Service worker for offline functionality
- **Advanced Analytics**: User behavior and recommendation engine

### Technical Debt
- **Code Organization**: Regular refactoring and cleanup
- **Dependency Updates**: Regular security and feature updates
- **Documentation**: Keep this context document updated
- **Performance**: Regular performance audits and optimizations

## 🎯 Development Guidelines

### Code Quality
- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Enforce consistent code style
- **Prettier**: Automatic code formatting
- **Git Hooks**: Pre-commit linting and formatting

### Git Workflow
- **Feature Branches**: Create branches for new features
- **Commit Messages**: Conventional commits format
- **Pull Requests**: Code review before merging
- **Squash Merges**: Clean commit history

### Documentation
- **Code Comments**: Explain complex logic and business rules
- **API Documentation**: JSDoc for public functions
- **Component Documentation**: Props and usage examples
- **Architecture Decisions**: Document major technical decisions

---

*This document should be updated as the project evolves to maintain accurate context for AI assistants and future developers.*
