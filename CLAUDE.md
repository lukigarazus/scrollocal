# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (React + TypeScript + Vite)
- `npm run dev` - Start Vite development server
- `npm run build` - Build TypeScript and Vite production bundle
- `npm run preview` - Preview production build locally
- `npm run build:tailwind` - Build Tailwind CSS with watch mode

### Desktop App (Tauri)
- `npm run start` - Start Tauri development app (includes both frontend and backend)
- `npm run tauri` - Run Tauri CLI commands

## Architecture Overview

This is a **Tauri-based desktop application** that combines:
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Backend**: Rust (Tauri) with custom file streaming and media processing

### Core Application Structure

The app has two main modes accessible via tabs:
1. **Gallery**: Media browsing and management interface
2. **Video**: Video editing and processing tools

### Key Frontend Architecture

- **Context-based state management**: Heavy use of React Context for:
  - `SettingsContext`: Application settings and configuration
  - `LocalFeedContext`: Local file management and metadata
  - `RemoteFeedContext`: Remote content integration (Scrolller API)
  - `FilterContext`, `TagContext`: Content filtering and tagging
  - `VideoElementContext`, `FullscreenContext`: Media playback state

- **Component organization**:
  - `/components/`: Reusable UI components (tabs, modals, etc.)
  - `/gallery/`: Gallery view and file cell components
  - `/videoEditing/`: Video editing interface and canvas utilities
  - `/settings/`: Settings panels and controls
  - `/contexts/`: React Context providers and hooks

### Key Backend Architecture (Rust/Tauri)

- **Custom URI scheme**: `stream://` protocol for efficient media streaming
- **File management**: Local media directory handling with metadata caching
- **Video processing**: FFmpeg integration for video editing and snipping
- **External API integration**: Scrolller API for remote content browsing
- **Data directories**:
  - `media/`: User's main media collection
  - `editor/`: Temporary files from video editing

### Important Technical Details

- **Streaming system**: Custom streaming protocol in `src-tauri/src/streaming/` handles efficient media delivery
- **File metadata**: JSON-based caching system for file information and tags
- **Video editing**: Uses FFmpeg-next for video processing and snipping functionality
- **Cross-platform**: Built with Tauri for desktop deployment across platforms

### Key Dependencies

**Frontend:**
- `@tauri-apps/api`: Tauri frontend API
- `masonic`: Virtualized grid layout for gallery
- `react-player`: Video playback component
- `pixelmatch`: Image comparison utilities

**Backend:**
- `tauri`: Core desktop app framework
- `ffmpeg-next`: Video processing capabilities
- `actix-web`: HTTP server functionality
- `reqwest`: HTTP client for external APIs

### Development Notes

- The app manages local media files and provides both gallery browsing and video editing capabilities
- Settings are persisted and loaded on app startup
- The streaming system allows efficient playback of large media files
- Video editing creates temporary clips that can be saved to the main gallery