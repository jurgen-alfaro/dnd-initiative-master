"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Globe,
  Loader2,
  Lock,
  NotebookText,
  Plus,
  ScrollText,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { addNote, getNotes } from "@/app/server/actions";
import type { Note, NoteVisibility } from "@/app/lib/types";
import { formatSessionDate } from "@/app/lib/date-format";

interface SessionNotesDrawerProps {
  partyCode: string;
  isDm: boolean;
  dmToken: string | null;
}

/** Returns today's date as a `yyyy-mm-dd` string in local time. */
function todayInputValue(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export default function SessionNotesDrawer({
  partyCode,
  isDm,
  dmToken,
}: SessionNotesDrawerProps) {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Add-note form state (DM only)
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<NoteVisibility>("public");
  const [sessionDate, setSessionDate] = useState(todayInputValue);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getNotes(partyCode, dmToken ?? undefined);
      setNotes(data);
    } catch {
      setError("No se pudieron cargar las notas");
    } finally {
      setIsLoading(false);
    }
  }, [partyCode, dmToken]);

  // Fetch notes whenever the drawer opens
  useEffect(() => {
    if (open) loadNotes();
  }, [open, loadNotes]);

  // Close on Escape and lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSave = async () => {
    if (!dmToken) return;
    if (content.trim() === "") {
      setError("La nota no puede estar vacía");
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      // Anchor at local noon so the chosen day doesn't shift across timezones
      const iso = new Date(`${sessionDate}T12:00:00`).toISOString();
      const result = await addNote(
        partyCode,
        dmToken,
        content.trim(),
        visibility,
        iso,
      );

      if ("error" in result) {
        setError(result.error);
        return;
      }

      setContent("");
      setVisibility("public");
      setSessionDate(todayInputValue());
      setShowForm(false);
      await loadNotes();
    } catch {
      setError("Error al guardar la nota");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="cursor-pointer gap-2 border-dnd-gold/30 text-dnd-gold hover:bg-dnd-gold/10"
      >
        <NotebookText size={16} />
        Notas
      </Button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex justify-end bg-black/60"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <aside className="flex h-full w-full max-w-md flex-col bg-card dnd-card-ornate dnd-parchment-texture shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-dnd-gold/20 px-5 py-4">
                <div className="flex items-center gap-2">
                  <ScrollText className="text-dnd-gold" size={20} />
                  <h2 className="font-heading text-lg font-bold tracking-wide text-dnd-gold">
                    Notas de sesión
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer text-muted-foreground hover:text-dnd-parchment"
                >
                  <X size={20} />
                  <span className="sr-only">Cerrar</span>
                </Button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {isLoading ? (
                  <div className="flex items-center justify-center py-10 text-muted-foreground">
                    <Loader2 className="animate-spin" size={24} />
                  </div>
                ) : notes.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Todavía no hay notas para esta party.
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {notes.map((note) => (
                      <li
                        key={note.id}
                        className="rounded-lg border border-dnd-gold/15 bg-dnd-parchment/5 p-4"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="font-heading text-sm font-semibold text-dnd-gold">
                            {formatSessionDate(note.sessionDate)}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              note.visibility === "private"
                                ? "gap-1 border-dnd-blood/40 text-dnd-blood-bright"
                                : "gap-1 border-emerald-500/40 text-emerald-400"
                            }
                          >
                            {note.visibility === "private" ? (
                              <>
                                <Lock size={11} /> Privada
                              </>
                            ) : (
                              <>
                                <Globe size={11} /> Pública
                              </>
                            )}
                          </Badge>
                        </div>
                        <p className="whitespace-pre-wrap text-sm text-dnd-parchment/90">
                          {note.content}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* DM-only add form */}
              {isDm && (
                <div className="border-t border-dnd-gold/20 px-5 py-4">
                  {showForm ? (
                    <div className="flex flex-col gap-3">
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Escribe la nota de la sesión..."
                        rows={4}
                        className="resize-none border-dnd-gold/20 bg-transparent"
                      />

                      <div className="flex items-center gap-2">
                        <label
                          htmlFor="sessionDate"
                          className="text-xs uppercase tracking-wider text-muted-foreground"
                        >
                          Fecha
                        </label>
                        <input
                          id="sessionDate"
                          type="date"
                          value={sessionDate}
                          onChange={(e) => setSessionDate(e.target.value)}
                          className="rounded-md border border-dnd-gold/20 bg-transparent px-2 py-1 text-sm text-dnd-parchment focus:outline-none focus:ring-1 focus:ring-dnd-gold/40"
                        />
                      </div>

                      {/* Visibility toggle */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={
                            visibility === "public" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setVisibility("public")}
                          className={
                            visibility === "public"
                              ? "gap-1 bg-emerald-600 text-white hover:bg-emerald-600/90"
                              : "gap-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                          }
                        >
                          <Globe size={14} /> Pública
                        </Button>
                        <Button
                          type="button"
                          variant={
                            visibility === "private" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setVisibility("private")}
                          className={
                            visibility === "private"
                              ? "gap-1 bg-dnd-blood text-white hover:bg-dnd-blood/90"
                              : "gap-1 border-dnd-blood/30 text-dnd-blood-bright hover:bg-dnd-blood/10"
                          }
                        >
                          <Lock size={14} /> Privada
                        </Button>
                      </div>

                      {error && (
                        <p className="text-sm text-dnd-blood-bright">{error}</p>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowForm(false);
                            setError(null);
                          }}
                          disabled={isSaving}
                          className="cursor-pointer"
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={isSaving}
                          className="cursor-pointer"
                        >
                          {isSaving ? "Guardando..." : "Guardar nota"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowForm(true)}
                      className="w-full cursor-pointer gap-2"
                    >
                      <Plus size={16} /> Agregar nota
                    </Button>
                  )}
                </div>
              )}
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
