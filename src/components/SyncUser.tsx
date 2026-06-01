"use client";

import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function SyncUser() {
  const { isLoaded, isSignedIn } = useUser();
  const storeUser = useMutation(api.users.storeUser);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // קריאה למוטציה ברגע שהמשתמש מזוהה כסשן פעיל ב-Clerk
      storeUser();
    }
  }, [isLoaded, isSignedIn, storeUser]);

  return null;
}