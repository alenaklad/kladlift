# Design Guidelines: Персональный тренировочный трекер

## Design Approach
**Reference-Based Implementation**: Exact pixel-perfect recreation of provided React code. This is a feature-rich fitness application with established visual design that must be preserved exactly as specified.

## Core Design Principles
- **Dark Theme Primary**: Deep backgrounds (#0A0E1A, #111827) with vibrant accent colors
- **Data Visualization Focus**: Charts, graphs, and progress tracking as primary UI elements
- **Muscle Group Color System**: Consistent color coding throughout (see below)
- **Russian Language**: All UI text, labels, and copy in Russian

## Color System

### Muscle Group Palette (Critical - Use Exact Values)
```
legs: #34C759 (green) - bg: #E8F5E9, text: #1B5E20
back: #007AFF (blue) - bg: #E3F2FD, text: #0D47A1
chest: #FF2D55 (red) - bg: #FFEBEE, text: #B71C1C
shoulders: #FF9500 (orange) - bg: #FFF3E0, text: #E65100
arms: #AF52DE (purple) - bg: #F3E5F5, text: #4A148C
abs: #8E8E93 (gray) - bg: #F5F5F5, text: #424242
cardio: #FF3B30 (bright red) - bg: #FFEBEE, text: #C62828
```

### Backgrounds & Surfaces
- Primary dark: #0A0E1A, #111827
- Card surfaces: #1F2937, #374151
- Overlays: rgba(0,0,0,0.5)

### Cycle Phase Colors (Female tracking)
- Menstrual: #EF4444 (red)
- Follicular: #EC4899 (pink)
- Ovulation: #8B5CF6 (purple)
- Luteal: #F59E0B (amber)

## Typography
- **System Fonts**: -apple-system, BlinkMacSystemFont, Segoe UI
- **Hierarchy**: 
  - Headers: font-semibold, text-lg to text-2xl
  - Body: text-sm to text-base
  - Labels: text-xs, uppercase tracking-wide
  - Numbers/Stats: font-bold, larger sizes for emphasis

## Layout System

### Spacing Units
- **Primary units**: p-2, p-4, p-6, p-8, m-4, gap-4, gap-6
- **Card padding**: p-6 standard, p-8 for larger cards
- **Section spacing**: mb-6, mb-8 between major sections

### Grid Patterns
- **Dashboard Cards**: 2-column grid on desktop, single column mobile
- **Exercise Library**: Grid with muscle group filters
- **Stats Display**: Flex layouts with justify-between for label/value pairs

## Component Library

### Navigation
- **Bottom Tab Bar** (Mobile iOS style): Fixed bottom, 5 tabs with icons (Dashboard, Workouts, Exercises, Analytics, Profile)
- **Top Header**: Logo/title left, icons/actions right

### Cards
- Rounded corners (rounded-xl, rounded-2xl)
- Dark backgrounds with subtle borders
- Drop shadows for depth
- Hover states with scale transforms

### Buttons
- **Primary**: Gradient backgrounds (blue-to-purple), white text, rounded-lg
- **Secondary**: Dark gray backgrounds, lighter text
- **Icon Buttons**: Circular, background on hover
- **Sizes**: Small (px-3 py-2), Medium (px-4 py-3), Large (px-6 py-4)

### Forms
- Dark input backgrounds (#1F2937)
- Light text (#E5E7EB)
- Focus states with blue ring
- Select dropdowns with custom styling

### Data Visualization
- **Charts**: Recharts library with muscle group color coding
- **Progress Bars**: Gradient fills matching muscle colors
- **Stat Cards**: Large numbers with descriptive labels below

### Modals & Overlays
- Full-screen overlays on mobile
- Centered modals on desktop (max-w-2xl, max-w-4xl)
- Backdrop blur effect
- Slide-up animation on mobile

### AI Chat Interface
- Message bubbles: User (blue gradient, right-aligned), Bot (dark gray, left-aligned)
- Avatar circles with initials
- Input bar at bottom with send button
- Scrollable message history

## Special Features

### Anatomical Muscle Diagram
- SVG-based human figure
- Interactive highlighting by muscle group
- Color-coded to match muscle group palette
- Displays in profile and exercise selection

### Calendar View
- Month grid layout
- Dots/indicators for workout days
- Color coding by workout type/muscle focus

### Exercise Cards
- Muscle group color accent bar on left
- Exercise name, type (compound/isolation)
- Technique description text
- Image thumbnails using Unsplash URLs

### Cycle Phase Tracker (Female Users)
- Phase indicator bar with 4 segments
- Current phase highlighted
- Recommendations panel with sleep/strain/stress guidance
- Color-coded by phase

## Images
- **Hero**: No traditional hero section - this is a dashboard app
- **Exercise Images**: Use provided Unsplash URLs for muscle group imagery
- **Thumbnails**: Small square images (w-12 h-12 to w-16 h-16) for exercises
- **Background**: Subtle gradient overlays, no large background images

## Animations
- **Minimal**: Smooth transitions on hover (transform scale 1.02)
- **Page transitions**: Fade in/out
- **Chart animations**: Recharts built-in smooth rendering
- No elaborate scroll animations

## Mobile-First Considerations
- Bottom navigation (iOS-style tab bar)
- Full-width cards on mobile
- Swipeable modals
- Touch-friendly tap targets (min 44px)
- Responsive grid: 1 col mobile → 2 cols tablet → 3 cols desktop

## Critical Implementation Notes
1. **Exact Color Matching**: Use provided hex values precisely
2. **Icon Library**: Lucide React (already imported)
3. **Chart Library**: Recharts for all data visualizations
4. **State Management**: React hooks (useState, useEffect, useMemo)
5. **Data Persistence**: localStorage for user data and workout history
6. **Russian UI**: All labels, buttons, descriptions in Russian language

This design is fully specified in the provided code - implement exactly as shown with no creative deviations.