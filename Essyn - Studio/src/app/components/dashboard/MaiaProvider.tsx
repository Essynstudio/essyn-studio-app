/**
 * MaiaProvider — Global context for the Maia AI assistant panel.
 * 
 * Provides:
 *   - isOpen / open / close / toggle state
 *   - Ctrl+K / Cmd+K global keyboard shortcut
 *   - Renders MaiaPanel overlay when open
 *
 * Usage: Wrap your app routes with <MaiaProvider> and use useMaia() hook.
 */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface MaiaContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  /** Focus Chat — full-screen immersive mode */
  isFocusMode: boolean;
  openFocusMode: () => void;
  closeFocusMode: () => void;
}

const MaiaContext = createContext<MaiaContextValue>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
  isFocusMode: false,
  openFocusMode: () => {},
  closeFocusMode: () => {},
});

export function useMaia() {
  return useContext(MaiaContext);
}

export function MaiaProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);
  const openFocusMode = useCallback(() => {
    setIsOpen(false); // close slide panel if open
    setIsFocusMode(true);
  }, []);
  const closeFocusMode = useCallback(() => setIsFocusMode(false), []);

  /* ── Global Ctrl+K / Cmd+K shortcut ── */
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        e.stopPropagation();
        // If focus mode is open, close it and open panel instead
        if (isFocusMode) {
          setIsFocusMode(false);
          return;
        }
        setIsOpen((prev) => !prev);
      }
      // Escape to close
      if (e.key === "Escape") {
        if (isFocusMode) {
          e.preventDefault();
          setIsFocusMode(false);
        } else if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isFocusMode]);

  return (
    <MaiaContext.Provider value={{ isOpen, open, close, toggle, isFocusMode, openFocusMode, closeFocusMode }}>
      {children}
    </MaiaContext.Provider>
  );
}