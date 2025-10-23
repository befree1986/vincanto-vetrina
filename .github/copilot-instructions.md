# Vincanto Codebase - AI Coding Agent Instructions

## Project Overview
Vincanto is a multilingual vacation rental website built with React/TypeScript + Vite, featuring extensive AI-powered optimization tools. The project includes a custom CLI for AI-assisted code optimization, SEO analysis, and automated content improvements using local Ollama models.

## Architecture & Key Components

### Frontend Structure
- **React SPA** with React Router v7, TypeScript, and Tailwind CSS
- **Internationalization**: i18next with IT/EN/DE/FR support (Italian default)
- **Cookie Management**: GDPR-compliant cookie system with analytics consent
- **SEO Components**: Custom SafeSeo component with dynamic meta tags
- **Image Gallery**: WebP-optimized images with TypeScript interfaces in `src/data/galleryData.ts`

### Backend & Services
- **Express API**: Simple Node.js server in `vincanto-backend/server.js` for contact forms
- **Vercel Deployment**: SPA routing configured in `vercel.json`
- **Email Integration**: Nodemailer for contact form submissions

### AI-Powered Development Tools
**Critical**: This project features a sophisticated AI optimization system using local Ollama models.

#### CLI Interface (`npm run cli`)
The main development workflow uses `scripts/cli.ts` which provides:
- **CSS Optimization**: Automatic unused class removal and variable suggestions
- **SEO Analysis**: AI-powered content and meta tag optimization
- **Content Generation**: Multilingual content creation with translation validation
- **Universal Auto-Apply**: Batch corrections across file types
- **Watch Mode**: Real-time AI suggestions during development

#### AI Integration Points
- **Ollama Local Models**: `ai/ollama.ts` connects to `localhost:11434` for LLama3
- **Learning Store**: `utils/learningStore.ts` tracks optimization history to improve suggestions
- **Correction Engines**: Separate utilities for React, HTML, Markdown, and SEO corrections
- **Change Tracking**: `utils/publishTracker.ts` generates automated changelogs

## Development Workflows

### Essential Commands
```bash
npm run cli              # Interactive AI optimization CLI
npm run lint-project     # Project-wide linting with AI suggestions
npm run dev              # Development server
npm run build            # Production build
```

### AI-Assisted Development
1. **Start Ollama**: Ensure local Ollama server is running on port 11434
2. **Run CLI**: Use `npm run cli` for guided optimization workflows
3. **CSS Optimization**: CLI analyzes unused classes and suggests CSS variables
4. **SEO Optimization**: AI reviews meta tags, content structure, and accessibility
5. **Content Generation**: Multilingual content creation with translation validation

### Image Management
- **WebP Conversion**: Run `python convert_to_webp.py` for image optimization
- **Gallery Structure**: Images organized by room/area in `public/` directories
- **TypeScript Interfaces**: Image metadata defined in `src/data/galleryData.ts`

## Project-Specific Patterns

### Translation Safety
Always use `getSafeTranslation()` from `src/i18n.ts` for fallback handling:
```typescript
const safeText = getSafeTranslation(t, 'key', 'fallback');
```

### Cookie Consent Integration
Components accessing analytics must check `userPreferences?.analytics` before loading tracking scripts.

### AI Utility Integration
When adding new optimization features:
1. Create utility in `utils/` directory
2. Register in `scripts/cli.ts` interactive menu
3. Add learning store integration for persistent improvements
4. Use Ollama integration pattern from existing utilities

### SEO Component Usage
Use `SafeSeo` component for dynamic meta tags:
```tsx
<SafeSeo page="home" ogImage="/logo.svg" canonical="https://www.vincantomaori.it" />
```

## File Organization Conventions
- **Utils**: AI and optimization tools in `utils/`
- **AI Core**: Ollama integration and prompts in `ai/`
- **Scripts**: CLI and automation in `scripts/`
- **Components**: Reusable React components in `src/components/`
- **Pages**: Route components in `src/pages/`
- **Sections**: Homepage sections in `src/sections/`

## Integration Points
- **Backend Communication**: Axios calls to Express server for contact forms
- **Vercel Analytics**: Conditional loading based on cookie preferences
- **Ollama Models**: Local AI model integration for development optimization
- **Image Pipeline**: Python-based WebP conversion for performance