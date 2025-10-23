# Design Guidelines: المسار التدريبي للجوالة (Scout Training Path Platform)

## Design Approach
**Hybrid Approach**: Material Design foundation with scout organization theming. This utility-focused training platform requires clear information hierarchy, excellent mobile usability, and visual elements that reflect the scout identity and mission of "preparing future leaders."

## Core Design Principles
- **Mobile-First RTL Design**: 100% optimized for Arabic mobile interfaces with right-to-left layout
- **Clear Information Hierarchy**: Course progress, badges, and training materials must be instantly scannable
- **Scout Identity**: Incorporate organizational colors and outdoor/adventure aesthetic without compromising functionality
- **Accessibility**: High contrast for outdoor viewing conditions on mobile devices

## Color Palette

**Dark Mode** (Primary focus given mobile usage):
- **Primary Brand**: 145 65% 45% (Scout green - represents growth and nature)
- **Secondary**: 35 40% 50% (Warm earth brown - represents tradition and reliability)
- **Accent**: 210 90% 55% (Trust blue - for interactive elements and progress indicators)
- **Background**: 220 15% 12% (Deep charcoal)
- **Surface**: 220 12% 18% (Elevated cards)
- **Text Primary**: 0 0% 95%
- **Text Secondary**: 0 0% 70%
- **Success**: 142 70% 45% (Course completion)
- **Warning**: 45 95% 60% (Locked courses)

**Light Mode** (Secondary):
- **Background**: 0 0% 98%
- **Surface**: 0 0% 100%
- **Text Primary**: 220 15% 15%
- Maintain same hue values for brand colors with adjusted lightness

## Typography
**Font Stack**: 
- **Primary**: 'IBM Plex Sans Arabic' or 'Cairo' via Google Fonts (excellent Arabic support, professional appearance)
- **Secondary**: 'Tajawal' for headings (clean, modern Arabic typography)

**Scale**:
- Hero Title: text-4xl font-bold (المسار التدريبي للجوالة)
- Subtitle: text-lg font-medium (رحلة إعداد القادة المستقبليين)
- Section Headers: text-2xl font-semibold
- Card Titles: text-xl font-semibold
- Body Text: text-base font-normal
- Small Text: text-sm (metadata, dates)

## Layout System
**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, 12, 16 for consistent rhythm
- Card padding: p-6 (mobile), p-8 (desktop if needed)
- Section spacing: space-y-6 (mobile), space-y-8 (larger screens)
- Component margins: mb-4, mt-6, gap-4

**Container Strategy**:
- Mobile: Full width with px-4 horizontal padding
- Max width for content: max-w-lg (centered for larger screens if accessed on tablet)
- Cards: Full width on mobile with rounded-xl borders

## Component Library

### 1. Barcode Login Screen
- **Hero Section**: Centered vertical layout with organization logo placeholder
- **Title Treatment**: Large, bold Arabic text with subtle gradient overlay
- **Upload Zone**: Dashed border card with camera icon, clear upload instructions
- **Visual Feedback**: Loading spinner during barcode processing, success/error states

### 2. User Profile/ID Card
- **Card Design**: Simulated physical ID card with subtle shadow and border
- **Layout**: Organization logo at top, user photo placeholder (if available), name in large text, serial number and stage in structured grid
- **Action Button**: Prominent "بدء المسار التدريبي" button with primary color
- **Details**: Badge-style pills for stage/level information

### 3. Dashboard (Main Training Hub)
- **Welcome Header**: Greeting with user name, aligned right (RTL)
- **Stats Row**: 4-column grid showing:
  - Total courses (8)
  - Completed courses
  - Earned certificates
  - Overall progress percentage (circular progress indicator)
- **Course Grid**: 
  - Single column on mobile
  - Each course card shows: title, lock/unlock icon, completion status
  - Locked courses: Reduced opacity (opacity-50) with lock icon overlay
  - Active course: Highlighted border with primary color
  - Completed courses: Green checkmark badge

### 4. Course Detail View
- **Header**: Course title with back button (Arabic left-pointing arrow)
- **Tab Navigation**: Three tabs (الدورة التدريبية, الامتحانات, الشهادات)
- **PDF Viewer Section**:
  - Embedded iframe for Google Drive PDF
  - Download button with clear icon and "تنزيل الملف" label
  - Progress indicator showing page number if trackable

### 5. Navigation
- **Top Bar**: Sticky header with logo, user name, logout option
- **Bottom Navigation** (if multi-section): Icon-based navigation for Dashboard, Profile, Settings
- **Breadcrumbs**: Text-based navigation trail for course hierarchy

## Visual Treatments

### Cards
- Border radius: rounded-xl (12px)
- Shadow: shadow-lg for elevated cards, shadow-md for standard
- Hover state: Subtle scale transform (scale-105) with transition-transform duration-200
- Border: 1px solid with surface color for definition in dark mode

### Buttons
- **Primary CTA**: Full-width on mobile, px-8 py-3, rounded-lg, primary color background
- **Secondary**: Outlined variant with border-2, transparent background
- **Icon Buttons**: Square aspect ratio with p-3

### Icons
- **Library**: Heroicons (CDN)
- **Size**: w-6 h-6 for standard, w-8 h-8 for feature icons
- **Color**: Inherit from parent text color

### Progress Indicators
- **Circular Progress**: For overall achievement percentage (top of dashboard)
- **Linear Progress Bars**: For individual course completion
- **Badges**: Rounded-full pills for status indicators (completed, locked, in-progress)

## Images

**Logo Placement**:
- **Login Screen**: Center-aligned, large size (w-32 h-32 or larger), mb-8
- **Profile Card**: Top-right corner (RTL), smaller size (w-16 h-16)
- **Header**: Small logo (w-10 h-10) in navigation bar

**User Photo** (if implemented):
- Circular avatar in profile card (w-24 h-24)
- Placeholder with user initials if no photo available

**Illustrations** (optional enhancement):
- Empty states for locked courses (simple SVG illustrations of locks/scouts)
- Completion celebration graphics when course finished

## Responsive Behavior
- **Mobile (default)**: Single column, full-width cards, vertical navigation
- **Tablet (md: 768px+)**: 2-column grid for course cards if screen space allows
- **Desktop (lg: 1024px+)**: Max-width container (max-w-4xl), centered layout, preserve mobile-optimized design

## RTL-Specific Considerations
- **Direction**: Apply `dir="rtl"` to HTML element
- **Text Alignment**: text-right for all Arabic text blocks
- **Icons**: Mirror directional icons (arrows, chevrons) for RTL context
- **Progress Bars**: Fill from right to left
- **Card Layout**: Important information on right side

## Animation Philosophy
**Minimal and Purposeful**:
- Page transitions: Simple fade-in (opacity animation)
- Course unlock: Subtle bounce animation when badge changes from locked to unlocked
- Button interactions: Standard active/hover states (no custom animations)
- Loading states: Spinner for barcode processing only

## Accessibility
- **Contrast**: Maintain WCAG AA standards (4.5:1 for text)
- **Touch Targets**: Minimum 44x44px for all interactive elements
- **Focus States**: Visible focus rings on all interactive elements
- **Arabic Screen Readers**: Proper semantic HTML with Arabic lang attributes