import React from 'react';

// Accessibility utility: Focus trap for modals
export function useFocusTrap(elementRef) {
  React.useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleKeyDown(e) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    }

    element.addEventListener('keydown', handleKeyDown);
    return () => element.removeEventListener('keydown', handleKeyDown);
  }, [elementRef]);
}

// Accessibility utility: Announce changes to screen readers
export function useAnnounce() {
  const announceRef = React.useRef(null);

  const announce = (message, politeness = 'polite') => {
    if (!announceRef.current) {
      const div = document.createElement('div');
      div.setAttribute('role', 'status');
      div.setAttribute('aria-live', politeness);
      div.setAttribute('aria-atomic', 'true');
      div.style.position = 'absolute';
      div.style.left = '-10000px';
      document.body.appendChild(div);
      announceRef.current = div;
    }
    announceRef.current.textContent = message;
  };

  return announce;
}

// Component: Accessible skip link
export function SkipLink({ href = '#main' }) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:bg-accent focus:text-white focus:p-2 focus:z-50"
    >
      Skip to main content
    </a>
  );
}
