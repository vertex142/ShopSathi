import { useEffect, useRef } from 'react';

const useFocusTrap = (modalRef: React.RefObject<HTMLElement>) => {
  const firstFocusableElement = useRef<HTMLElement | null>(null);
  const lastFocusableElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        firstFocusableElement.current = focusableElements[0] as HTMLElement;
        lastFocusableElement.current = focusableElements[focusableElements.length - 1] as HTMLElement;
        firstFocusableElement.current.focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab' || !document.body.contains(document.activeElement)) return;

        if (e.shiftKey) { // Shift + Tab
          if (document.activeElement === firstFocusableElement.current) {
            lastFocusableElement.current?.focus();
            e.preventDefault();
          }
        } else { // Tab
          if (document.activeElement === lastFocusableElement.current) {
            firstFocusableElement.current?.focus();
            e.preventDefault();
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [modalRef]);
};

export default useFocusTrap;