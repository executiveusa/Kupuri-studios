# @kupuri/ui

> Motion-enhanced UI component library for the Kupuri Studios ecosystem

## Installation

This package is automatically available in the monorepo workspace:

```bash
# In apps, import directly:
import { Button, Card, FadeIn } from '@kupuri/ui';
```

## Components

### Core Components

| Component | Description |
|-----------|-------------|
| `Button` | Motion-enhanced button with variants |
| `Card` | Container with header, content, footer |
| `Input` | Form input with label and error |
| `Modal` | Animated modal dialog |
| `Tabs` | Tab navigation with animations |
| `Badge` | Status and label indicator |
| `Avatar` | User avatar with status |
| `Dropdown` | Dropdown menu and select |
| `Toast` | Notification system |
| `Spinner` | Loading indicators |
| `Progress` | Progress bars |

### Ecosystem Components

| Component | Description |
|-----------|-------------|
| `TokenBalance` | Unified token balance display |
| `BubbleSwitcher` | Navigate between ecosystem bubbles |
| `UserMenu` | User account dropdown |
| `EcosystemPanel` | Full ecosystem status sidebar |

### Motion Primitives

| Component | Description |
|-----------|-------------|
| `FadeIn` | Fade in animation |
| `ScaleIn` | Scale in animation |
| `SlideIn` | Slide in animation |
| `StaggerContainer` | Stagger children animations |
| `StaggerItem` | Child of StaggerContainer |
| `AnimatedContainer` | Toggle visibility with animation |
| `HoverScale` | Scale on hover |
| `PressScale` | Scale on press |
| `Skeleton` | Loading placeholder |
| `Pulse` | Pulse animation |
| `Spin` | Spin animation |
| `Bounce` | Bounce animation |

## Usage Examples

### Button

```tsx
import { Button } from '@kupuri/ui';

// Variants: default, destructive, outline, secondary, ghost, link, kupuri
<Button variant="kupuri" size="lg" isLoading>
  Create Video
</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@kupuri/ui';

<Card>
  <CardHeader>
    <CardTitle>Project Title</CardTitle>
    <CardDescription>Project description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

### Motion Animations

```tsx
import { FadeIn, StaggerContainer, StaggerItem } from '@kupuri/ui';

// Single element fade in
<FadeIn delay={0.2} direction="up">
  <h1>Welcome</h1>
</FadeIn>

// Staggered list
<StaggerContainer staggerDelay={0.1}>
  {items.map(item => (
    <StaggerItem key={item.id}>
      <Card>{item.name}</Card>
    </StaggerItem>
  ))}
</StaggerContainer>
```

### Ecosystem Components

```tsx
import { 
  EcosystemPanel, 
  BubbleSwitcher, 
  TokenBalance,
  defaultBubbles 
} from '@kupuri/ui';

// Full ecosystem sidebar
<EcosystemPanel
  currentBubble="jaaz"
  tokenBalance={7500}
  tokenUsage={{ jaaz: 2500, postiz: 1200 }}
  onBubbleChange={(id) => navigate(`/${id}`)}
  onRecharge={() => openBillingModal()}
/>

// Just bubble switcher
<BubbleSwitcher
  bubbles={defaultBubbles}
  currentBubble="jaaz"
  onBubbleChange={setCurrentBubble}
/>
```

### Toast Notifications

```tsx
import { useToast, ToastContainer } from '@kupuri/ui';

function App() {
  const { toasts, toast } = useToast();

  return (
    <>
      <Button onClick={() => toast.success('Saved!', 'Your changes were saved')}>
        Save
      </Button>
      
      <ToastContainer toasts={toasts} onClose={(id) => toast.dismiss(id)} />
    </>
  );
}
```

## Theming

The library uses CSS variables for theming. Override in your app's CSS:

```css
:root {
  --primary: 262.1 83.3% 57.8%;
  --primary-foreground: 210 40% 98%;
  /* ... other variables */
}

.dark {
  --primary: 262.1 83.3% 57.8%;
  /* ... dark mode overrides */
}
```

## Dependencies

- `motion` (framer-motion) - Animations
- `class-variance-authority` - Variant management
- `clsx` + `tailwind-merge` - Class utilities
- `lucide-react` - Icons
