"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";

interface EditModeContextValue {
  isEditing: boolean;
  isChecking: boolean;
}

const EditModeContext = createContext<EditModeContextValue>({
  isEditing: false,
  isChecking: true,
});

export function useEditMode() {
  return useContext(EditModeContext);
}

export function EditModeProvider({ children }: { children: React.ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    // Check sessionStorage cache first
    try {
      const cached = sessionStorage.getItem("edit_mode");
      if (cached === "true") {
        setIsEditing(true);
        setIsChecking(false);
        return;
      }
      if (cached === "false") {
        setIsChecking(false);
        return;
      }
    } catch {}

    // No cache — check API
    fetch("/api/auth/me")
      .then(r => {
        if (r.ok) {
          setIsEditing(true);
          try { sessionStorage.setItem("edit_mode", "true"); } catch {}
        } else {
          try { sessionStorage.setItem("edit_mode", "false"); } catch {}
        }
        setIsChecking(false);
      })
      .catch(() => {
        setIsChecking(false);
        try { sessionStorage.setItem("edit_mode", "false"); } catch {}
      });
  }, []);

  return (
    <EditModeContext.Provider value={{ isEditing, isChecking }}>
      {children}
    </EditModeContext.Provider>
  );
}
