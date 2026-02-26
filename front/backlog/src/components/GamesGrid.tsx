"use client";

import {
  Badge,
  Box,
  Grid,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";
import { Game } from "@/lib/types";
import GameCard from "./GameCard";
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  type PriorityOption,
  type StatusOption,
} from "@/lib/gameOptions";

const PRIORITY_LABEL: Record<PriorityOption, string> = {
  MAYBE_SOMEDAY: "Maybe Someday",
  MUST_PLAY: "Must Play",
  FAVORITE: "Favorite",
};

function buildGamesQuery(params: {
  store?: string | null;
  title?: string;
}): string {
  const q = new URLSearchParams();
  if (params.title) q.set("title", params.title);
  if (params.store && params.store !== "__NONE__") q.set("store", params.store);
  q.set("sort", "title");
  q.set("order", "asc");
  const qs = q.toString();
  return qs ? `?${qs}` : "";
}

function toggle<T extends string>(
  value: T,
  setList: React.Dispatch<React.SetStateAction<T[]>>,
) {
  setList((prev) =>
    prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
  );
}

type FilterItem =
  | { type: "priority"; value: PriorityOption; label: string }
  | { type: "status"; value: StatusOption; label: string };

const FILTERS: FilterItem[] = [
  ...PRIORITY_OPTIONS.map((p) => ({
    type: "priority" as const,
    value: p,
    label: PRIORITY_LABEL[p],
  })),
  ...STATUS_OPTIONS.map((s) => ({
    type: "status" as const,
    value: s,
    label: s,
  })),
];

export function GamesGrid({
  selectedStore,
  onQueueChanged,
  refreshSignal,
}: {
  selectedStore: string | null;
  onQueueChanged?: () => void;
  refreshSignal?: number;
}) {
  const [title, setTitle] = useState("");
  const [data, setData] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [selectedStatuses, setSelectedStatuses] = useState<StatusOption[]>([]);

  const [selectedPriorities, setSelectedPriorities] = useState<
    PriorityOption[]
  >(() => ["MAYBE_SOMEDAY", "MUST_PLAY"]);

  const query = useMemo(
    () => buildGamesQuery({ store: selectedStore, title }),
    [selectedStore, title],
  );

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setErr(null);

    (async () => {
      try {
        const rows = await apiGet<Game[]>(`/games${query}`);
        if (cancelled) return;

        const filtered =
          selectedStore === "__NONE__" ? rows.filter((g) => !g.store) : rows;

        setData(filtered);
      } catch (e) {
        if (!cancelled) console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [query, selectedStore, refreshSignal]);

  async function handleAddToQueue(igdbId: number) {
    await apiSend(`/queue/${igdbId}`, "POST");
    onQueueChanged?.();
  }

  const filteredData = useMemo(() => {
    return data.filter((g: Game) => {
      const gamePriorities: PriorityOption[] = Array.isArray(g.priority)
        ? g.priority
        : g.priority
          ? [g.priority]
          : [];

      const statusOk =
        selectedStatuses.length === 0
          ? true
          : selectedStatuses.includes(g.status);
      const priorityOk =
        selectedPriorities.length === 0
          ? true
          : gamePriorities.length === 0
            ? true
            : gamePriorities.some((p) => selectedPriorities.includes(p));

      return priorityOk && statusOk;
    });
  }, [data, selectedStatuses, selectedPriorities]);

  return (
    <Box>
      <HStack mb={4} justify={"space-between"} wrap="wrap" gap={2} w={"full"}>
        <HStack
          gap={2}
          overflowX="auto"
          whiteSpace="nowrap"
          pb={1}
          css={{ "&::-webkit-scrollbar": { display: "none" } }}
        >
          {FILTERS.map((f) => {
            const active =
              f.type === "priority"
                ? selectedPriorities.includes(f.value)
                : selectedStatuses.includes(f.value);

            return (
              <Badge
                key={`${f.type}:${f.value}`}
                as="button"
                cursor="pointer"
                variant={active ? "solid" : "outline"}
                opacity={active ? 1 : 0.65}
                onClick={() => {
                  if (f.type === "priority")
                    toggle(f.value, setSelectedPriorities);
                  else toggle(f.value, setSelectedStatuses);
                }}
                rounded="full"
                px={3}
                py={1.5}
                alignItems="center"
                justifyContent="center"
                textAlign="center"
                fontSize="sm"
                lineHeight="1"
                userSelect="none"
                whiteSpace="nowrap"
                _hover={{ bg: "gray" }}
              >
                {f.label}
              </Badge>
            );
          })}
        </HStack>

        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Search by title…"
          w={"xs"}
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
          {filteredData.map((g) => (
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
