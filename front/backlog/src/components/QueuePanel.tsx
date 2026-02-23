"use client";

import {
  Box,
  Button,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";
import type { QueueItem, StateResponse } from "@/lib/types";

export function QueuePanel({
  refreshSignal,
}: {
  refreshSignal: number; // incrementalo desde Home para forzar refetch
}) {
  const [nowPlaying, setNowPlaying] =
    useState<StateResponse["nowPlaying"]>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [state, q] = await Promise.all([
        apiGet<StateResponse>("/state"),
        apiGet<QueueItem[]>("/queue"),
      ]);
      setNowPlaying(state.nowPlaying ?? null);
      setQueue(q);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  async function remove(igdbId: number) {
    await apiSend(`/queue/${igdbId}`, "DELETE");
    await load();
  }

  return (
    <Stack gap={3}>
      <Box p={4} borderWidth="1px" borderRadius="lg">
        <Heading size="sm" mb={2}>
          Now Playing
        </Heading>

        {loading ? (
          <HStack>
            <Spinner size="sm" />
            <Text>Loading…</Text>
          </HStack>
        ) : nowPlaying ? (
          <Stack gap={1}>
            <Text fontWeight="bold" maxLines={2}>
              {nowPlaying.title}
            </Text>
            <Text fontSize="sm" opacity={0.8}>
              {nowPlaying.store ?? "No store"}{" "}
              {typeof nowPlaying.releaseYear === "number"
                ? `• ${nowPlaying.releaseYear}`
                : ""}
            </Text>
          </Stack>
        ) : (
          <Text opacity={0.8}>Nothing playing yet.</Text>
        )}
      </Box>

      <Box p={4} borderWidth="1px" borderRadius="lg">
        <HStack justify="space-between" mb={2}>
          <Heading size="sm">Queue</Heading>
          <Text fontSize="sm" opacity={0.8}>
            {queue.length}
          </Text>
        </HStack>

        {err && (
          <Box p={3} borderWidth="1px" borderRadius="md" mb={2}>
            <Text fontWeight="bold">Error</Text>
            <Text>{err}</Text>
          </Box>
        )}

        {loading ? (
          <HStack>
            <Spinner size="sm" />
            <Text>Loading queue…</Text>
          </HStack>
        ) : queue.length ? (
          <Stack gap={2}>
            {queue.map((item) => (
              <HStack
                key={item.igdbId ?? item.title}
                justify="space-between"
                p={2}
                borderWidth="1px"
                borderRadius="md"
              >
                <Box>
                  <Text fontWeight="bold" maxLines={1}>
                    {item.title}
                  </Text>
                  <Text fontSize="xs" opacity={0.7}>
                    pos: {item.queuePosition ?? "-"}
                  </Text>
                </Box>

                {typeof item.igdbId === "number" && (
                  <Button
                    size="xs"
                    variant="outline"
                    onClick={() => remove(item.igdbId!)}
                  >
                    Remove
                  </Button>
                )}
              </HStack>
            ))}
          </Stack>
        ) : (
          <Text opacity={0.8}>Queue is empty.</Text>
        )}
      </Box>
    </Stack>
  );
}
