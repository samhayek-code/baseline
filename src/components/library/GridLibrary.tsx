"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SavedGrid } from "@/lib/grid-state";
import { createClient } from "@/lib/supabase/client";
import GridCard from "./GridCard";
import BatchDownloadBar from "./BatchDownloadBar";
import { RiArrowLeftLine, RiGridLine } from "@remixicon/react";
import "@/styles/editor.css";

interface GridLibraryProps {
  initialGrids: SavedGrid[];
}

export default function GridLibrary({ initialGrids }: GridLibraryProps) {
  const router = useRouter();
  const [grids, setGrids] = useState<SavedGrid[]>(initialGrids);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selected.size === grids.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(grids.map((g) => g.id)));
    }
  }, [grids, selected.size]);

  const handleLoad = useCallback(
    (id: string) => {
      router.push(`/editor?load=${id}`);
    },
    [router],
  );

  const handleDelete = useCallback(async (id: string) => {
    const supabase = createClient();
    const { error } = await supabase.from("saved_grids").delete().eq("id", id);
    if (!error) {
      setGrids((prev) => prev.filter((g) => g.id !== id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, []);

  const handleRename = useCallback(async (id: string, name: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("saved_grids")
      .update({ name })
      .eq("id", id);
    if (!error) {
      setGrids((prev) =>
        prev.map((g) => (g.id === id ? { ...g, name } : g)),
      );
    }
  }, []);

  const selectedGrids = grids.filter((g) => selected.has(g.id));

  return (
    <div className="library-page">
      <div className="library-header">
        <div className="library-header-left">
          <a href="/editor" className="back-btn">
            <RiArrowLeftLine size={20} />
          </a>
          <h1>My Grids</h1>
          <span className="grid-count">{grids.length}</span>
        </div>
        <div className="library-header-right">
          {grids.length > 0 && (
            <button className="select-all-btn" onClick={selectAll}>
              {selected.size === grids.length ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>
      </div>

      {grids.length === 0 ? (
        <div className="library-empty">
          <RiGridLine size={48} />
          <h2>No saved grids yet</h2>
          <p>Create a grid in the editor and save it to build your library.</p>
          <a href="/editor" className="empty-cta">
            Open Editor
          </a>
        </div>
      ) : (
        <div className="library-grid">
          {grids.map((grid) => (
            <GridCard
              key={grid.id}
              grid={grid}
              selected={selected.has(grid.id)}
              onSelect={toggleSelect}
              onLoad={handleLoad}
              onDelete={handleDelete}
              onRename={handleRename}
            />
          ))}
        </div>
      )}

      {selected.size > 0 && (
        <BatchDownloadBar
          selectedGrids={selectedGrids}
          onClear={() => setSelected(new Set())}
        />
      )}
    </div>
  );
}
