"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ConfirmLeaveDialog } from "./confirm-leave-dialog";

type LeaveAction = () => void | Promise<void>;

type UnsavedChangesContextValue = {
  isDirty: boolean;
  setIsDirty: (isDirty: boolean) => void;
  requestLeave: (action: LeaveAction) => boolean;
};

const UnsavedChangesContext = createContext<UnsavedChangesContextValue | null>(
  null,
);

export function UnsavedChangesProvider({ children }: { children: ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const pendingActionRef = useRef<LeaveAction | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  const requestLeave = useCallback(
    (action: LeaveAction) => {
      if (!isDirty) {
        try {
          void Promise.resolve(action()).catch(() => undefined);
        } catch {
          // The initiating component owns any action-specific error UI.
        }
        return false;
      }

      pendingActionRef.current = action;
      setIsDialogOpen(true);
      return true;
    },
    [isDirty],
  );

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (isLeaving) return;
      setIsDialogOpen(open);
      if (!open) pendingActionRef.current = null;
    },
    [isLeaving],
  );

  const handleConfirm = useCallback(async () => {
    const action = pendingActionRef.current;
    if (!action) return;

    setIsLeaving(true);
    setIsDirty(false);
    try {
      await action();
      pendingActionRef.current = null;
      setIsDialogOpen(false);
    } catch {
      setIsDirty(true);
      pendingActionRef.current = null;
      setIsDialogOpen(false);
    } finally {
      setIsLeaving(false);
    }
  }, []);

  const value = useMemo(
    () => ({ isDirty, setIsDirty, requestLeave }),
    [isDirty, requestLeave],
  );

  return (
    <UnsavedChangesContext.Provider value={value}>
      {children}
      <ConfirmLeaveDialog
        open={isDialogOpen}
        onOpenChange={handleOpenChange}
        onConfirm={handleConfirm}
        isPending={isLeaving}
      />
    </UnsavedChangesContext.Provider>
  );
}

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error(
      "useUnsavedChanges must be used within UnsavedChangesProvider",
    );
  }
  return context;
}
