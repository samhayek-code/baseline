"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { RiLoginBoxLine, RiGridLine, RiLogoutBoxLine } from "@remixicon/react";
import type { User } from "@supabase/supabase-js";

export default function UserMenu() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    setOpen(false);
    window.location.href = "/editor";
  };

  if (!user) {
    return (
      <a href="/auth/login" className="sign-in-btn">
        <RiLoginBoxLine size={14} />
        Sign In
      </a>
    );
  }

  const avatarUrl =
    user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const displayName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  return (
    <div className="user-menu" ref={menuRef}>
      <button className="user-avatar-btn" onClick={() => setOpen(!open)}>
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="user-avatar" />
        ) : (
          <div className="user-avatar-placeholder">
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="user-dropdown">
          <div className="user-dropdown-header">
            <span className="user-dropdown-name">{displayName}</span>
            <span className="user-dropdown-email">{user.email}</span>
          </div>
          <div className="user-dropdown-divider" />
          <a href="/library" className="user-dropdown-item" onClick={() => setOpen(false)}>
            <RiGridLine size={16} />
            My Grids
          </a>
          <button className="user-dropdown-item" onClick={handleSignOut}>
            <RiLogoutBoxLine size={16} />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
