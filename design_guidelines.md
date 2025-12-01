# Design Guidelines: Персональный тренировочный трекер (KladLift)

## Design Approach
**Split Theme System**: Dark theme for landing/authentication pages (Jony Ive minimalist style), light theme for authenticated app experience. This creates a premium, sophisticated first impression while maintaining a clean, productive workspace for daily training use.

## Core Design Principles
- **Dual Theme Strategy**: Dark landing/auth pages, light authenticated app
- **Jony Ive Aesthetic**: Minimalist, premium, refined gradients on auth pages
- **Data Visualization Focus**: Charts, graphs, and progress tracking as primary UI elements
- **Muscle Group Color System**: Consistent color coding throughout (optimized for light backgrounds)
- **Russian Language**: All UI text, labels, and copy in Russian

## Color System

### Landing/Auth Pages (Dark Theme)
- **Background**: Gradient from slate-900 via purple-900 to slate-900
- **Text**: White primary, slate-400 secondary
- **Accents**: Purple gradients (purple-600 to purple-700)
- **Cards/Surfaces**: slate-800/50 with backdrop blur
- **Borders**: Subtle white/20 borders

### Authenticated App (Light Theme)
- **Background**: slate-50 (#F8FAFC)
- **Cards/Surfaces**: White (#FFFFFF) with slate-200 borders
- **Text Primary**: slate-900 (#0F172A)
- **Text Secondary**: slate-500 (#64748B)
- **Text Tertiary**: slate-400 (#94A3B8)
- **Accents**: Purple gradients (purple-600 to purple-700)
- **Shadows**: Subtle slate shadows

### Muscle Group Palette (Critical - Optimized for Light Backgrounds)
```
legs: #34C759 (green) - bg: #E8F5E9, text: #1B5E20
back: #007AFF (blue) - bg: #E3F2FD, text: #0D47A1
chest: #FF2D55 (red) - bg: #FFEBEE, text: #B71C1C
shoulders: #FF9500 (orange) - bg: #FFF3E0, text: #E65100
arms: #AF52DE (purple) - bg: #F3E5F5, text: #4A148C
abs: #8E8E93 (gray) - bg: #F5F5F5, text: #424242
cardio: #FF3B30 (bright red) - bg: #FFEBEE, text: #C62828
```
Note: These colors feature light pastel backgrounds (bg) with dark text colors for optimal contrast on white/light surfaces.

### Cycle Phase Colors (Female tracking)
- Menstrual: #EF4444 (red)
- Follicular: #EC4899 (pink)
- Ovulation: #8B5CF6 (purple)
- Luteal: #F59E0B (amber)

## Typography
- **System Fonts**: -apple-system, BlinkMacSystemFont, Segoe UI
- **Hierarchy**: 
  - Headers: font-semibold/font-bold, text-lg to text-2xl, slate-900
  - Body: text-sm to text-base, slate-700
  - Labels: text-xs, uppercase tracking-wide, slate-500
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
- **Bottom Tab Bar** (Mobile iOS style): Fixed bottom, 4-5 tabs with icons
- **Top Header**: Logo/title left, user info/actions right
- **Background**: White with border-b border-slate-200

### Cards (Light Theme)
- Background: white
- Borders: border border-slate-200
- Rounded corners: rounded-2xl, rounded-3xl
- Shadows: shadow-sm for subtle depth
- Hover states: hover:shadow-md, hover:border-purple-300

### Buttons
- **Primary**: Gradient from purple-600 to purple-700, white text, rounded-full
- **Secondary**: slate-100 background, slate-700 text
- **Ghost**: Transparent, slate-500 text, hover:bg-slate-100
- **Icon Buttons**: Circular, rounded-full, hover:bg-slate-100

### Forms (Light Theme)
- Input backgrounds: slate-100 or white
- Borders: border-slate-200
- Text: slate-900
- Placeholder: slate-400
- Focus states: ring-2 ring-purple-500/20, border-purple-500

### Data Visualization
- **Charts**: Recharts library with muscle group color coding
- **Backgrounds**: White cards on slate-50 page background
- **Tooltips**: White background, slate-700 text, shadow-lg

### Modals & Overlays
- Backdrop: bg-black/40 backdrop-blur-sm
- Modal surface: bg-white with rounded-3xl
- Headers: Can use muscle group colors for context

### AI Chat Interface (Light Theme)
- **User messages**: Purple gradient (purple-600 to purple-700), white text, right-aligned
- **Bot messages**: White/slate-50 background, slate-700 text, left-aligned, border border-slate-200
- **Input bar**: slate-100 background, white on focus
- **Send button**: Purple gradient

## Special Features

### Anatomical Muscle Diagram
- SVG-based human figure
- Interactive highlighting by muscle group
- Color-coded to match muscle group palette

### Exercise Cards (Light Theme)
- White background with muscle group accent elements
- Muscle badges use pastel bg colors with dark text
- Clean, readable typography

### Cycle Phase Tracker
- Phase indicator bar with 4 segments
- Color-coded by phase against light backgrounds
- White/light card surfaces

## Animations
- **Minimal**: Smooth transitions on hover
- **Page transitions**: Fade in, slide up
- **Chart animations**: Recharts built-in smooth rendering
- **Scaling**: active:scale-[0.98] on buttons/cards

## Mobile-First Considerations
- Bottom navigation (iOS-style tab bar)
- Full-width cards on mobile
- Touch-friendly tap targets (min 44px)
- Safe area padding for notched devices

## Critical Implementation Notes
1. **Theme Switching**: Landing/auth = dark, Authenticated app = light
2. **Muscle Colors**: Use bg values on light surfaces, color values for accents/charts
3. **Icon Library**: Lucide React
4. **Chart Library**: Recharts with light theme styling
5. **State Management**: React hooks + TanStack Query
6. **Data Persistence**: PostgreSQL via Drizzle ORM
7. **Russian UI**: All labels, buttons, descriptions in Russian language
