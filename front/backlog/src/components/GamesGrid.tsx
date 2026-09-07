"use client";

import {
  Badge,
  Box,
  Button,
  Grid,
  HStack,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";
import { Game } from "@/lib/types";
import GameCard from "./GameCard";
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  type PriorityOption,
  type StatusOption,
} from "@/lib/gameOptions";
import SearchInput, { HoursFilter, SortBy, SortDir } from "./SearchInput";

const PRIORITY_LABEL: Record<PriorityOption, string> = {
  MAYBE_SOMEDAY: "Maybe Someday",
  MUST_PLAY: "Must Play",
  FAVORITE: "Favorite",
  DONE: "Done",
};

const STATUS_LABEL: Record<StatusOption, string> = {
  BACKLOG: "Backlog",
  PLAYING: "Playing",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
  PAUSED: "Paused",
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
  ...PRIORITY_OPTIONS.filter((p) => p !== "DONE").map((p) => ({
    type: "priority" as const,
    value: p,
    label: PRIORITY_LABEL[p],
  })),
  ...STATUS_OPTIONS.filter((s) => s !== "PLAYING" && s !== "PAUSED").map(
    (s) => ({
      type: "status" as const,
      value: s,
      label: STATUS_LABEL[s],
    }),
  ),
];

function matchesHoursFilter(hours: number | null, filter: HoursFilter) {
  if (filter === "all") return true;
  if (hours === null) return false;
  if (filter === "short") return hours <= 10;
  if (filter === "medium") return hours > 10 && hours <= 30;
  return hours > 30;
}

function getGamePriorities(g: Game): PriorityOption[] {
  return Array.isArray(g.priority)
    ? g.priority
    : g.priority
      ? [g.priority]
      : [];
}

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
  const [sortBy, setSortBy] = useState<SortBy>("title");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const [selectedStatuses, setSelectedStatuses] = useState<StatusOption[]>([]);

  const [selectedPriorities, setSelectedPriorities] = useState<
    PriorityOption[]
  >(() => ["MAYBE_SOMEDAY", "MUST_PLAY"]);
  const [hoursFilter, setHoursFilter] = useState<HoursFilter>("all");

  const query = useMemo(
    () => buildGamesQuery({ store: selectedStore, title }),
    [selectedStore, title],
  );

  const [visibleCount, setVisibleCount] = useState(20);
  const loaderRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((c) => c + 20);
        }
      },
      { threshold: 1 },
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  async function handleAddToQueue(igdbId: number) {
    await apiSend(`/queue/${igdbId}`, "POST");
    onQueueChanged?.();
  }

  function handleGamePatched(updated: Game) {
    setData((prev) =>
      prev.map((g) => (g.igdbId === updated.igdbId ? { ...g, ...updated } : g)),
    );
  }

  function handleGameDeleted(igdbId: number) {
    setData((prev) => prev.filter((g) => g.igdbId !== igdbId));
  }

  const filteredData = useMemo(() => {
    const rows = data.filter((g: Game) => {
      const gamePriorities: PriorityOption[] = Array.isArray(g.priority)
        ? g.priority
        : g.priority
          ? [g.priority]
          : [];
      const isCompleted =
        g.status === "COMPLETED" || gamePriorities.includes("DONE");

      const statusOk =
        selectedStatuses.length === 0
          ? true
          : selectedStatuses.some((status) =>
              status === "COMPLETED" ? isCompleted : status === g.status,
            );

      const priorityOk =
        selectedPriorities.length === 0
          ? true
          : gamePriorities.length === 0
            ? true
            : gamePriorities.some((p) => selectedPriorities.includes(p));

      return (
        priorityOk &&
        statusOk &&
        matchesHoursFilter(g.estimatedHours, hoursFilter)
      );
    });

    const dir = sortDir === "asc" ? 1 : -1;

    rows.sort((a, b) => {
      if (sortBy === "title") {
        return dir * (a.title ?? "").localeCompare(b.title ?? "");
      }

      if (sortBy === "releaseYear") {
        const ay = typeof a.releaseYear === "number" ? a.releaseYear : null;
        const by = typeof b.releaseYear === "number" ? b.releaseYear : null;
        if (ay === null && by === null) return 0;
        if (ay === null) return 1;
        if (by === null) return -1;
        return dir * (ay - by);
      }

      const ah = typeof a.estimatedHours === "number" ? a.estimatedHours : null;
      const bh = typeof b.estimatedHours === "number" ? b.estimatedHours : null;
      if (ah === null && bh === null) return 0;
      if (ah === null) return 1;
      if (bh === null) return -1;
      return dir * (ah - bh);
    });

    return rows;
  }, [
    data,
    selectedStatuses,
    selectedPriorities,
    hoursFilter,
    sortBy,
    sortDir,
  ]);

  const counts = useMemo(() => {
    // base = data ya viene filtrada por store + title en tu useEffect
    const rows = data;

    const statusCounts: Record<string, number> = {};
    const priorityCounts: Record<string, number> = {};

    // Pre-inicializar para que siempre exista el key
    STATUS_OPTIONS.forEach((s) => (statusCounts[s] = 0));
    PRIORITY_OPTIONS.forEach((p) => (priorityCounts[p] = 0));

    // Para cada juego, contamos status y prioridad respetando los filtros activos.
    for (const g of rows) {
      if (!matchesHoursFilter(g.estimatedHours, hoursFilter)) continue;

      const gamePriorities = getGamePriorities(g);

      // ¿Pasa el filtro de prioridades actual?
      const passesCurrentPriorities =
        selectedPriorities.length === 0
          ? true
          : gamePriorities.length === 0
            ? true
            : gamePriorities.some((p) => selectedPriorities.includes(p));

      // ¿Pasa el filtro de status actual?
      const passesCurrentStatuses =
        selectedStatuses.length === 0
          ? true
          : selectedStatuses.some((status) =>
              status === "COMPLETED"
                ? g.status === "COMPLETED" || gamePriorities.includes("DONE")
                : status === g.status,
            );

      // Contar status (respetando prioridades actuales)
      if (passesCurrentPriorities) {
        const statusKey =
          g.status === "COMPLETED" || gamePriorities.includes("DONE")
            ? "COMPLETED"
            : g.status;
        if (statusKey && statusCounts[statusKey] !== undefined) {
          statusCounts[statusKey] += 1;
        }
      }

      // Contar prioridades (respetando statuses actuales)
      if (passesCurrentStatuses) {
        // Si querés que "sin priority" cuente para todos como hoy tu filtro,
        // NO hay una categoría. Acá contamos solo cuando el juego tiene esa priority.
        for (const p of gamePriorities) {
          if (priorityCounts[p] !== undefined) {
            priorityCounts[p] += 1;
          }
        }
      }
    }

    return { statusCounts, priorityCounts };
  }, [data, selectedPriorities, selectedStatuses, hoursFilter]);

  useEffect(() => {
    setVisibleCount(20);
  }, [filteredData]);

  return (
    <Box>
      <HStack
        justify={"space-between"}
        align={"center"}
        wrap="wrap"
        w={"full"}
        py={2}
      >
        <HStack
          overflowX="auto"
          whiteSpace="nowrap"
          css={{ "&::-webkit-scrollbar": { display: "none" } }}
        >
          {FILTERS.map((f) => {
            const active =
              f.type === "priority"
                ? selectedPriorities.includes(f.value)
                : selectedStatuses.includes(f.value);

            const total =
              f.type === "priority"
                ? (counts.priorityCounts[f.value] ?? 0)
                : (counts.statusCounts[f.value] ?? 0);

            return (
              <Badge
                gap={0}
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
                py={2}
                fontSize="sm"
                lineHeight="1"
                userSelect="none"
                whiteSpace="nowrap"
                _hover={{ bg: "gray" }}
              >
                {f.label}
                {""}
                <Box as="span" opacity={0.85} ml={2}>
                  ({total})
                </Box>
              </Badge>
            );
          })}
        </HStack>

        {/* <Input
          value={title}
          placeholder="Search by title…"
          w={"xs"}
        /> */}
        <SearchInput
          title={title}
          onTitleChange={setTitle}
          sortBy={sortBy}
          sortDir={sortDir}
          onSortChange={({ sortBy, sortDir }) => {
            setSortBy(sortBy);
            setSortDir(sortDir);
          }}
          hoursFilter={hoursFilter}
          onHoursFilterChange={setHoursFilter}
        />
      </HStack>

      <HStack gap={2} mb={3} wrap="wrap">
        {(selectedStatuses.length > 0 ||
          selectedPriorities.length > 0 ||
          hoursFilter !== "all" ||
          title) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedStatuses([]);
              setSelectedPriorities([]);
              setHoursFilter("all");
              setTitle("");
            }}
          >
            Clear filters
          </Button>
        )}
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
        <>
          <Grid templateColumns="repeat(auto-fill, minmax(240px, 1fr))" gap={3}>
            {filteredData.slice(0, visibleCount).map((g) => (
              <GameCard
                key={g.igdbId ?? g.title}
                {...g}
                handleAddToQueue={handleAddToQueue}
                onGamePatched={handleGamePatched}
                onGameDeleted={handleGameDeleted}
                onQueueChanged={onQueueChanged}
              />
            ))}
          </Grid>
        </>
      )}
      <div ref={loaderRef} style={{ height: 1 }} />
    </Box>
  );
}
