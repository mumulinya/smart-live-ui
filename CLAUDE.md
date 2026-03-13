# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Vue.js 2.x based admin management system (RuoYi-Vue derivative). It uses Element UI for the interface and is built with Vue CLI 4.

## Common Commands

### Development
- `npm install` - Install dependencies (Recommend using registry: `https://registry.npmmirror.com`)
- `npm run dev` - Start development server (access at http://localhost:80)

### Build
- `npm run build:prod` - Build for production
- `npm run build:stage` - Build for staging environment
- `npm run preview` - Preview the built project

### Other
- `npm run lint` - Lint and fix files (if configured in scripts, otherwise check package.json)

## Code Architecture

### Tech Stack
- **Framework**: Vue.js 2.6.x
- **UI Library**: Element UI 2.15.x
- **State Management**: Vuex
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **CSS Preprocessor**: Sass (Dart Sass)
- **Build Tool**: Vue CLI 4.x / Webpack 4

### Directory Structure
- `src/api` - API request modules
- `src/assets` - Static assets (images, styles)
- `src/components` - Global reusable components
- `src/directive` - Custom directives
- `src/layout` - Layout components (Sidebar, Navbar, TagsView)
- `src/router` - Routing configuration
- `src/store` - Vuex state management
- `src/utils` - Utility functions
- `src/views` - Page components
- `vue.config.js` - Project configuration (proxy, webpack alias, etc.)

## Important Notes
- **Node.js Version**: Project specifies `>=8.9`, but Node 14.x or 16.x is recommended. Node 17+ may require `NODE_OPTIONS=--openssl-legacy-provider`.
- **Sass**: Uses `sass` (Dart Sass), avoiding compilation issues common with `node-sass`.
- **Environment**: Configuration files `.env.development`, `.env.production` control environment variables.
