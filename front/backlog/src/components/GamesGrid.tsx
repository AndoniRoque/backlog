"use client";

import {
  Badge,
  Box,
  Button,
  Grid,
  Heading,
  HStack,
  Input,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";
import type { Game } from "@/lib/types";
import GameCard from "./GameCard";

function buildGamesQuery(params: {
  store?: string | null;
  title?: string;
}): string {
  const q = new URLSearchParams();
  if (params.title) q.set("title", params.title);
  if (params.store && params.store !== "__NONE__") q.set("store", params.store);
  // si store === "__NONE__", lo filtramos en cliente (porque tu API filtra por contains)
  q.set("sort", "title");
  q.set("order", "asc");
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

export function GamesGrid({
  selectedStore,
  onQueueChanged,
}: {
  selectedStore: string | null;
  onQueueChanged?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [data, setData] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const query = useMemo(
    () => buildGamesQuery({ store: selectedStore, title }),
    [selectedStore, title],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErr(null);

    apiGet<Game[]>(`/games${query}`)
      .then((rows) => {
        if (cancelled) return;
        // filtro especial para store null
        const filtered =
          selectedStore === "__NONE__" ? rows.filter((g) => !g.store) : rows;
        setData(filtered);
      })
      .catch((e) => !cancelled && setErr(e.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [query, selectedStore]);

  async function handleAddToQueue(igdbId: number) {
    await apiSend(`/queue/${igdbId}`, "POST");
    onQueueChanged?.();
  }

  return (
    <Box>
      <HStack mb={4} justify="space-between">
        <Heading size="md">All Games</Heading>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Search by title…"
          maxW="360px"
        />
      </HStack>

      {loading && (
        <HStack>
          <Spinner />
          <Text>Loading games…</Text>
        </HStack>
      )}

      {err && (
        <Box p={3} borderWidth="1px" borderRadius="md">
          <Text fontWeight="bold">Error</Text>
          <Text>{err}</Text>
        </Box>
      )}

      {!loading && !err && (
        <Grid templateColumns="repeat(auto-fill, minmax(240px, 1fr))" gap={3}>
          {data.map((g) => (
            <GameCard
              key={g.igdbId ?? g.title}
              {...g}
              handleAddToQueue={handleAddToQueue}
            />
          ))}
        </Grid>
      )}
    </Box>
  );
}
