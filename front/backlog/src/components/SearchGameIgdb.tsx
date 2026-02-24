"use client";

import { apiGet, apiSend } from "@/lib/api";
import type { Game } from "@/lib/types";
import {
  Box,
  Input,
  Spinner,
  Text,
  HStack,
  Button,
  Dialog,
  NativeSelect,
  Field,
  NumberInput,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { toaster } from "./ui/toaster";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

// Opciones predefinidas por el sistema (ajustalas a tus enums reales)
const STORE_OPTIONS = [
  "Steam",
  "Epic",
  "Xbox",
  "PlayStation",
  "Nintendo",
  "GOG",
  "Origin",
  "Uplay",
] as const;

const PRIORITY_OPTIONS = ["FAVORITES", "MUST_PLAY", "MAYBE_SOMEDAY"] as const;

type StoreOption = (typeof STORE_OPTIONS)[number];
type PriorityOption = (typeof PRIORITY_OPTIONS)[number];

export default function SearchGameIgdb() {
  const [data, setData] = useState<Game[]>([]);
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim(), 350);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  // Dialog controlado (v3)
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Game | null>(null);

  // Campos editables
  const [store, setStore] = useState<StoreOption>("Steam");
  const [priority, setPriority] = useState<PriorityOption>("MAYBE_SOMEDAY");
  const [estimatedHours, setEstimatedHours] = useState<number | "">("");

  const path = useMemo(() => {
    if (!debounced) return null;
    const qs = new URLSearchParams({ name: debounced });
    return `/igdb/search?${qs.toString()}`;
  }, [debounced]);

  useEffect(() => {
    let cancelled = false;

    if (!path) {
      setData([]);
      setErr(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErr(null);

    apiGet<Game[]>(path)
      .then((rows) => {
        if (cancelled) return;
        setData(rows);
      })
      .catch((e) => {
        if (cancelled) return;
        setErr(e.message ?? "Search failed");
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  function openAddDialog(g: Game) {
    setSelected(g);
    // defaults (personalizalos como quieras)
    setStore("Steam");
    setPriority("MAYBE_SOMEDAY");
    setEstimatedHours("");
    setOpen(true);
  }

  async function confirmAdd() {
    if (!selected || typeof selected.igdbId !== "number") return;

    setErr(null);
    setSavingId(selected.igdbId);

    try {
      await apiSend("/games", "POST", {
        igdbId: selected.igdbId,
        store,
        priority,
        ...(estimatedHours === "" ? {} : { estimatedHours }),
      });

      toaster.create({
        description: `"${selected.title}" added to backlog!`,
        type: "success",
        duration: 2000,
      });

      setOpen(false);
      setSelected(null);
      // opcional: limpiar
      // setQuery("");
      // setData([]);
    } catch (e: any) {
      setErr(e.message ?? "Failed to add game");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <Box>
      <Input
        placeholder="Add games..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        w="full"
      />

      <Box mt={2}>
        {loading && (
          <HStack position="absolute">
            <Spinner size="sm" />
            <Text fontSize="sm">Searching…</Text>
          </HStack>
        )}

        {err && (
          <Text fontSize="sm" color="red.500" position="absolute">
            {err}
          </Text>
        )}

        {!loading && !err && data.length > 0 && (
          <Box
            position="absolute"
            zIndex={1000}
            w={360}
            overflowY="auto"
            maxH="280px"
          >
            {data.map((g) => (
              <HStack
                key={g.igdbId ?? g.title}
                justify="space-between"
                py={2}
                borderBottomWidth="1px"
                onClick={() => openAddDialog(g)}
                _hover={{ cursor: "pointer" }}
                bg="rgba(34, 34, 34, 0.8)"
                p={4}
              >
                <Text fontSize="sm" maxLines={1}>
                  <b>{g.title}</b>
                  {typeof g.releaseYear === "number"
                    ? ` (${g.releaseYear})`
                    : ""}
                </Text>
              </HStack>
            ))}
          </Box>
        )}
      </Box>

      {/* Dialog (Modal en v3) */}
      <Dialog.Root open={open} onOpenChange={(d) => setOpen(d.open)} size="md">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.CloseTrigger />
            <Dialog.Header>
              <Dialog.Title>
                Add to Queue {selected?.title ? `— ${selected.title}` : ""}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <Field.Root mb="4">
                <Field.Label>Store</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={store}
                    onChange={(e) => setStore(e.target.value as StoreOption)}
                  >
                    {STORE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>

              <Field.Root mb="4">
                <Field.Label>Priority</Field.Label>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as PriorityOption)
                    }
                  >
                    {PRIORITY_OPTIONS.map((p) => (
                      <option key={p} value={p}>
                        {p.replaceAll("_", " ")}
                      </option>
                    ))}
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Field.Root>

              <Field.Root>
                <Field.Label>Estimated hours (optional)</Field.Label>
                <Input
                  min={0}
                  value={estimatedHours}
                  onChange={(details) => {
                    const n = Number(details.target.value);
                    setEstimatedHours(Number.isFinite(n) ? n : "");
                  }}
                />
              </Field.Root>
            </Dialog.Body>

            <Dialog.Footer gap="2">
              <Button
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  setSelected(null);
                }}
              >
                Cancel
              </Button>
              <Button
                colorPalette="blue"
                onClick={confirmAdd}
                loading={
                  typeof savingId === "number" && savingId === selected?.igdbId
                }
                disabled={!selected || typeof selected.igdbId !== "number"}
              >
                Add
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Box>
  );
}
