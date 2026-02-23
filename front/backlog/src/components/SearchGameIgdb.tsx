"use client";

import { apiGet, apiSend } from "@/lib/api";
import type { Game } from "@/lib/types";
import { Box, Input, Spinner, Text, HStack, Button } from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debounced;
}

// Ajustá esto si querés permitir elegirlo en UI
const DEFAULT_PRIORITY = "MAYBE_SOMEDAY" as const;

export default function SearchGameIgdb() {
  const [data, setData] = useState<Game[]>([]);
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query.trim(), 350);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [savingId, setSavingId] = useState<number | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

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

  async function addGame(g: Game) {
    if (typeof g.igdbId !== "number") return;

    setErr(null);
    setSavedMsg(null);
    setSavingId(g.igdbId);

    try {
      await apiSend("/games", "POST", {
        igdbId: g.igdbId,
        priority: DEFAULT_PRIORITY, // tu backend hoy lo requiere
        store: "Steam", // opcional
      });

      setSavedMsg(`Added: ${g.title}`);
      // opcional: limpiar búsqueda
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
        placeholder="Search games..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <Box mt={2}>
        {loading && (
          <HStack>
            <Spinner size="sm" />
            <Text fontSize="sm">Searching…</Text>
          </HStack>
        )}

        {err && (
          <Text fontSize="sm" color="red.500">
            {err}
          </Text>
        )}

        {savedMsg && (
          <Text fontSize="sm" color="green.500">
            {savedMsg}
          </Text>
        )}

        {!loading && !err && data.length > 0 && (
          <Box mt={2}>
            {data.map((g) => (
              <HStack
                key={g.igdbId ?? g.title}
                justify="space-between"
                py={2}
                borderBottomWidth="1px"
              >
                <Text fontSize="sm" noOfLines={1}>
                  <b>{g.title}</b>
                  {typeof g.releaseYear === "number"
                    ? ` (${g.releaseYear})`
                    : ""}
                </Text>

                <Button
                  size="xs"
                  onClick={() => addGame(g)}
                  isLoading={savingId === g.igdbId}
                  isDisabled={typeof g.igdbId !== "number"}
                >
                  Add
                </Button>
              </HStack>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
