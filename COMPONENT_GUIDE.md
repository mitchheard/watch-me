# 🧩 Component Guide

This document provides comprehensive documentation for the UI components used in the Watch Me application.

## 🎨 Design System Overview

### Color Palette
```css
/* Primary Colors */
--blue-50: #eff6ff
--blue-600: #2563eb
--blue-700: #1d4ed8

/* Neutral Colors */
--gray-50: #f9fafb
--gray-100: #f3f4f6
--gray-600: #4b5563
--gray-700: #374151
--gray-800: #1f2937
--gray-900: #111827

/* Semantic Colors */
--green-100: #dcfce7
--green-700: #15803d
--yellow-100: #fef3c7
--yellow-700: #a16207
--red-100: #fee2e2
--red-700: #b91c1c
```

### Typography
- **Font Family:** Inter (system fallback)
- **Heading Sizes:** text-2xl, text-xl, text-lg, text-md
- **Body Text:** text-base, text-sm, text-xs
- **Font Weights:** font-normal, font-medium, font-semibold, font-bold

### Spacing & Layout
- **Base Unit:** 4px (0.25rem)
- **Container Max Width:** max-w-4xl, max-w-6xl
- **Border Radius:** rounded-lg, rounded-md, rounded-full
- **Shadows:** shadow-sm, shadow-md, shadow-lg

## 🧩 Core Components

### Modal Component
**File:** `src/components/Modal.tsx`

**Purpose:** Reusable modal dialog with responsive behavior

**Props:**
```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}
```

**Usage:**
```tsx
<Modal 
  isOpen={isModalOpen} 
  onClose={() => setIsModalOpen(false)}
  title="Add Movie"
  size="lg"
>
  <WatchlistForm onAddItem={handleAddItem} />
</Modal>
```

**Features:**
- Responsive design (bottom sheet on mobile, centered on desktop)
- Backdrop click to close
- Escape key to close
- Focus trap for accessibility
- Scrollable content area

### WatchlistForm Component
**File:** `src/components/watchlist/WatchlistForm.tsx`

**Purpose:** Form for adding/editing watchlist items

**Props:**
```typescript
interface WatchlistFormProps {
  _onAddItem: (item: WatchlistFormData) => Promise<void>;
  initialData?: WatchlistFormData;
  mode?: 'add' | 'edit';
}
```

**Features:**
- React Hook Form integration
- TMDB search integration
- Real-time search suggestions
- Form validation
- Loading states
- Error handling

**Form Fields:**
- Title (required)
- Type (movie/show)
- Status (want-to-watch/watching/finished)
- Current Season (TV shows only)
- Total Seasons (TV shows only)
- Notes (optional)
- Rating (loved/liked/not-for-me)

### WatchlistItems Component
**File:** `src/components/watchlist/WatchlistItems.tsx`

**Purpose:** Display and manage watchlist items

**Features:**
- Grid/list view toggle
- Search and filtering
- Status-based filtering
- Item editing and deletion
- Optimistic updates
- Loading states
- Empty state handling

**Filter Options:**
- All items
- Want to watch
- Currently watching
- Finished
- Movies only
- TV shows only

### Card Components

#### WatchlistCard
**Purpose:** Individual watchlist item display

**Features:**
- Poster image with fallback
- Title and metadata
- Status badge
- Rating display
- Action buttons (edit/delete)
- Hover effects
- Responsive layout

**Metadata Display:**
- Release year
- Runtime (movies)
- Seasons (TV shows)
- Rating (if available)
- User notes (if any)

#### SearchResultCard
**Purpose:** Display TMDB search results

**Features:**
- Poster image
- Title and year
- Type indicator
- Add to watchlist button
- Hover effects

## 🎯 Component Patterns

### State Management
```tsx
// Local state for UI interactions
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<WatchItem | null>(null);

// Server state with loading/error handling
const [items, setItems] = useState<WatchItem[]>([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Event Handling
```tsx
// Consistent event handler patterns
const handleAddItem = async (item: WatchlistFormData) => {
  try {
    setIsLoading(true);
    await addItemToWatchlist(item);
    setItems(prev => [...prev, newItem]);
    setIsModalOpen(false);
  } catch (error) {
    setError('Failed to add item');
  } finally {
    setIsLoading(false);
  }
};
```

### Loading States
```tsx
// Consistent loading state patterns
{isLoading ? (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
) : (
  // Content
)}
```

### Error Handling
```tsx
// Consistent error display
{error && (
  <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
    <p className="text-red-700 text-sm">{error}</p>
  </div>
)}
```

## 📱 Responsive Design Patterns

### Mobile-First Approach
```tsx
// Base styles for mobile
<div className="p-4 space-y-4">
  {/* Mobile layout */}
</div>

// Enhanced for tablet
<div className="p-4 space-y-4 md:p-6 md:space-y-6">
  {/* Tablet enhancements */}
</div>

// Enhanced for desktop
<div className="p-4 space-y-4 md:p-6 md:space-y-6 lg:p-8 lg:space-y-8">
  {/* Desktop enhancements */}
</div>
```

### Grid Layouts
```tsx
// Responsive grid patterns
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {/* Grid items */}
</div>
```

### Modal Behavior
```tsx
// Mobile: bottom sheet
<div className="fixed inset-0 z-50 md:hidden">
  <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg">
    {/* Modal content */}
  </div>
</div>

// Desktop: centered modal
<div className="fixed inset-0 z-50 hidden md:flex items-center justify-center">
  <div className="bg-white rounded-lg max-w-md w-full mx-4">
    {/* Modal content */}
  </div>
</div>
```

## ♿ Accessibility Features

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order follows logical flow
- Escape key closes modals
- Enter/Space activates buttons

### Screen Reader Support
- Semantic HTML elements
- ARIA labels for interactive elements
- Proper heading hierarchy
- Alt text for images

### Focus Management
- Focus trap in modals
- Focus restoration after modal close
- Visible focus indicators
- Skip links for navigation

## 🎨 Animation Patterns

### Framer Motion Usage
```tsx
import { motion } from 'framer-motion';

// Fade in animation
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>

// Slide up animation
<motion.div
  initial={{ y: 20, opacity: 0 }}
  animate={{ y: 0, opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  {/* Content */}
</motion.div>
```

### Hover Effects
```tsx
// Consistent hover patterns
<div className="transition-all duration-200 hover:shadow-lg hover:scale-105">
  {/* Content */}
</div>
```

## 🔧 Component Testing Patterns

### Component Structure
```tsx
// Consistent component structure
export default function ComponentName({ prop1, prop2 }: ComponentProps) {
  // 1. State declarations
  const [state, setState] = useState(initialState);
  
  // 2. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  // 3. Event handlers
  const handleEvent = () => {
    // Event logic
  };
  
  // 4. Render
  return (
    <div className="component-classes">
      {/* JSX */}
    </div>
  );
}
```

### Props Interface
```tsx
// Consistent props interface pattern
interface ComponentProps {
  // Required props
  requiredProp: string;
  
  // Optional props with defaults
  optionalProp?: string;
  
  // Event handlers
  onEvent: (data: EventData) => void;
  
  // Children
  children?: React.ReactNode;
}
```

---

*This component guide should be updated as new components are added or existing ones are modified.*
