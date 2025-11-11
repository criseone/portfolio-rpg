# Project: Portfolio RPG

## Project Overview

This is a personal portfolio presented as a 3D role-playing game. The user explores a digital "overworld" to discover projects and skills. The project is built using TypeScript and Three.js, with Vite serving as the build tool and development server.

The visual style is "ZNA — Low-Poly Plant-Futurism," characterized by faceted, convex forms, hard edges, and flat colors. The world features a perpetual late-afternoon lighting setup, low-poly vegetation, and distinct architectural language for different elements.

The core of the application resides in `src/main.ts`, which orchestrates the game loop, rendering, player controls, and interactions between various game elements. The game state, such as unlocked characters and project "monoliths," is managed in `src/state.ts`. The world layout, including the placement of monoliths, trees, and props, is defined in `src/config/world-layout.svg`, allowing for a visual and declarative approach to level design.

The architecture is modular, with distinct components for:
- **Overworld:** The main 3D world (`src/overworld/`).
- **Player:** Player movement and controls (`src/player/`).
- **NPCs:** Non-player characters that roam the world (`src/npcs/`).
- **World Objects:** Interactive elements like "Monoliths" representing projects (`src/world/`).
- **Encounters:** A battle system for skill challenges (`src/encounters/`).
- **UI:** HTML-based user interface elements (`src/ui/`).
- **VFX:** Particle effects and other visual enhancements (`src/vfx/`).

## Building and Running

The project uses `npm` for dependency management.

- **Install dependencies:**
  ```bash
  npm install
  ```

- **Run the development server:**
  This command will start a local server, open a browser window, and enable hot-reloading.
  ```bash
  npm run dev
  ```

- **Build for production:**
  This command bundles the application for deployment.
  ```bash
  npm run build
  ```

- **Preview the production build:**
  This command serves the production build locally.
  ```bash
  npm run preview
  ```

## Development Conventions

- **Technology Stack:** TypeScript, Three.js, Vite.
- **Modularity:** The codebase is organized by feature into different directories within `src`.
- **State Management:** A central state management system is used via `src/state.ts` to track player progress and game status.
- **UI:** UI components are created using HTML and styled with CSS to achieve a "glassmorphism" effect. A global `.glass-ui` class in `src/style.css` provides the base styling for this effect.
- **World Layout:** The placement of objects in the overworld is defined declaratively in `src/config/world-layout.svg`. A `LayoutService` parses this file and provides object positions to the application, allowing for visual editing of the world layout.
- **Typing:** The project uses strict TypeScript (`"strict": true` in `tsconfig.json`) for type safety.
- **Code Style:** The code follows modern ES module syntax (`import`/`export`).