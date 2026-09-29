"use client";

import Squares from "@/components/reactBits/Squares";
import { apiGet } from "@/lib/api";
import { STORE_OPTIONS } from "@/lib/gameOptions";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

type Statistics = {
  year: number;
  summary: {
    completedGames: number;
    totalEstimatedHours: number;
    averageEstimatedHours: number;
    backlogGames: number;
    playingGames: number;
    droppedGames: number;
    favoriteGames: number;
    droppedThisYear: number;
  };
  monthlyCompleted: {
    month: number;
    name: string;
    count: number;
    hours: number;
  }[];
  monthlyDropped: { month: number; name: string; count: number }[];
  completionTimeline: {
    date: string;
    igdbId: number | null;
    title: string;
    store: string | null;
    estimatedHours: number | null;
    priority: string;
    status: "COMPLETED" | "DROPPED";
  }[];
  byStore: { store: string; count: number }[];
  byStatus: { status: string; count: number }[];
  hours: { completedEstimated: number; droppedExcluded: boolean };
  filters: { store?: string };
};

type LibraryFilter = "COMPLETED" | "DROPPED" | "FAVORITES";
type TimelineGame = Statistics["completionTimeline"][number];

function matchesLibraryFilter(
  game: TimelineGame,
  filter: LibraryFilter | null,
) {
  if (filter === "FAVORITES") {
    return game.status === "COMPLETED" && game.priority === "FAVORITE";
  }
  if (filter === "COMPLETED" || filter === "DROPPED") {
    return game.status === filter;
  }
  return true;
}

function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Box p={4} borderWidth="1px" borderRadius="lg" bg="blackAlpha.200">
      <Text fontSize="sm" opacity={0.7}>
        {label}
      </Text>
      <Text fontSize="3xl" fontWeight="bold" lineHeight="1.1" mt={2}>
        {value}
      </Text>
      <Text fontSize="xs" opacity={0.65} mt={2}>
        {detail}
      </Text>
    </Box>
  );
}

export default function StatisticsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [selectedLibraryFilter, setSelectedLibraryFilter] =
    useState<LibraryFilter | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ year: String(year) });

    apiGet<Statistics>(`/stats?${params.toString()}`)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setStats(null);
          setError(
            reason instanceof Error
              ? reason.message
              : "Failed to load statistics",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [year]);

  const periodGames = useMemo(
    () =>
      stats?.completionTimeline.filter(
        (game) =>
          (selectedMonth === null ||
            new Date(game.date).getUTCMonth() === selectedMonth) &&
          matchesLibraryFilter(game, selectedLibraryFilter),
      ) ?? [],
    [selectedLibraryFilter, selectedMonth, stats],
  );

  const selectedTimeline = useMemo(
    () =>
      periodGames.filter(
        (game) =>
          selectedStore === null ||
          (game.store?.trim() || "No store") === selectedStore,
      ),
    [periodGames, selectedStore],
  );

  const periodSummary = useMemo(() => {
    const completedGames = selectedTimeline.filter(
      (game) => game.status === "COMPLETED",
    );
    const totalEstimatedHours = completedGames.reduce(
      (total, game) => total + (game.estimatedHours ?? 0),
      0,
    );

    return {
      completedGames: completedGames.length,
      droppedGames: selectedTimeline.filter((game) => game.status === "DROPPED")
        .length,
      totalEstimatedHours,
      averageEstimatedHours:
        completedGames.length > 0
          ? Number((totalEstimatedHours / completedGames.length).toFixed(1))
          : 0,
    };
  }, [selectedTimeline]);

  const periodByStore = useMemo(() => {
    const counts: Record<
      string,
      { completedGames: number; droppedGames: number }
    > = Object.fromEntries(
      STORE_OPTIONS.map((store) => [
        store,
        { completedGames: 0, droppedGames: 0 },
      ]),
    );

    for (const game of periodGames) {
      const store = game.store?.trim() || "No store";
      counts[store] ??= { completedGames: 0, droppedGames: 0 };
      if (game.status === "COMPLETED") counts[store].completedGames += 1;
      if (game.status === "DROPPED") counts[store].droppedGames += 1;
    }

    const knownStores = new Set<string>(STORE_OPTIONS);
    const additionalStores = Object.keys(counts)
      .filter((store) => !knownStores.has(store))
      .sort((a, b) => a.localeCompare(b));

    return [...STORE_OPTIONS, ...additionalStores].map((store) => ({
      store,
      ...counts[store],
    }));
  }, [periodGames]);

  const monthlyByStore = useMemo(() => {
    const months = Array.from({ length: 12 }, () => ({
      completedGames: 0,
      droppedGames: 0,
    }));

    for (const game of stats?.completionTimeline ?? []) {
      if (!matchesLibraryFilter(game, selectedLibraryFilter)) continue;
      if (
        selectedStore !== null &&
        (game.store?.trim() || "No store") !== selectedStore
      ) {
        continue;
      }

      const month = months[new Date(game.date).getUTCMonth()];
      if (game.status === "COMPLETED") month.completedGames += 1;
      if (game.status === "DROPPED") month.droppedGames += 1;
    }

    return months;
  }, [selectedLibraryFilter, selectedStore, stats]);

  const periodLabel =
    selectedMonth === null
      ? String(year)
      : `${stats?.monthlyCompleted[selectedMonth]?.name ?? MONTHS[selectedMonth]} ${year}`;

  const maxMonthlyCount = useMemo(
    () => Math.max(...monthlyByStore.map((month) => month.completedGames), 1),
    [monthlyByStore],
  );

  const maxDroppedCount = useMemo(
    () => Math.max(...monthlyByStore.map((month) => month.droppedGames), 1),
    [monthlyByStore],
  );

  return (
    <Box minH="100vh" position="relative" overflow="hidden">
      <Box position="fixed" inset={0} zIndex={0} pointerEvents="none">
        <Squares
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="#271E37"
          hoverFillColor="#222222"
        />
      </Box>

      <Box
        position="relative"
        zIndex={1}
        p={{ base: 4, md: 6 }}
        maxW="1400px"
        mx="auto"
      >
        <Flex
          justify="space-between"
          align={{ base: "start", md: "center" }}
          gap={4}
          wrap="wrap"
        >
          <Box>
            <Text fontSize="sm" opacity={0.65} mb={1}>
              Backlog overview
            </Text>
            <Heading size={{ base: "lg", md: "xl" }}>Statistics</Heading>
          </Box>
          <HStack wrap="wrap" justify="end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setYear((value) => value - 1)}
              aria-label="Previous year"
            >
              ←
            </Button>
            <Text fontWeight="bold" minW="14" textAlign="center">
              {year}
            </Text>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setYear((value) => value + 1)}
              aria-label="Next year"
            >
              →
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.history.back()}
            >
              Back
            </Button>
          </HStack>
        </Flex>

        {loading && (
          <HStack mt={10} justify="center">
            <Spinner />
            <Text>Loading statistics...</Text>
          </HStack>
        )}

        {error && !loading && (
          <Box mt={6} p={4} borderWidth="1px" borderRadius="lg">
            <Text fontWeight="bold">Could not load statistics</Text>
            <Text mt={1} opacity={0.75}>
              {error}
            </Text>
          </Box>
        )}

        {stats && !loading && (
          <Stack gap={5} mt={6}>
            <Grid
              templateColumns={{ base: "1fr 1fr", md: "repeat(4, 1fr)" }}
              gap={3}
            >
              <StatCard
                label="Completed / Dropped"
                value={`${periodSummary.completedGames} / ${periodSummary.droppedGames}`}
                detail={`games closed in ${periodLabel}`}
              />
              <StatCard
                label="Estimated hours"
                value={`${periodSummary.totalEstimatedHours}h`}
                detail={`completed games in ${periodLabel}`}
              />
              <StatCard
                label="Average length"
                value={`${periodSummary.averageEstimatedHours}h`}
                detail={`per completed game in ${periodLabel}`}
              />
              <StatCard
                label="Still in backlog"
                value={stats.summary.backlogGames}
                detail={`${stats.summary.playingGames} currently playing`}
              />
            </Grid>

            <Grid
              templateColumns={{ base: "1fr", lg: "2fr 1fr" }}
              gap={5}
              alignItems="start"
            >
              <Box p={4} borderWidth="1px" borderRadius="lg">
                <Flex justify="space-between" align="center" mb={5}>
                  <Box>
                    <Heading size="sm">Completion rhythm</Heading>
                    <Text fontSize="sm" opacity={0.65}>
                      {selectedStore
                        ? `${selectedStore} games closed month by month`
                        : "Games closed month by month"}
                    </Text>
                  </Box>
                  <Badge variant="outline">
                    {stats.hours.droppedExcluded
                      ? "Dropped excluded"
                      : "All statuses"}
                  </Badge>
                </Flex>
                <HStack gap={4} mb={3} fontSize="xs" opacity={0.75}>
                  <HStack gap={1}>
                    <Box w="8px" h="8px" borderRadius="sm" bg="teal.300" />
                    <Text>Completed</Text>
                  </HStack>
                  <HStack gap={1}>
                    <Box w="8px" h="8px" borderRadius="sm" bg="red.300" />
                    <Text>Dropped</Text>
                  </HStack>
                </HStack>
                <Flex h="190px" align="end" gap={{ base: 1, md: 3 }}>
                  {stats.monthlyCompleted.map((month, index) => {
                    const monthStats = monthlyByStore[index];
                    const height = `${Math.max((monthStats.completedGames / maxMonthlyCount) * 100, monthStats.completedGames ? 8 : 2)}%`;
                    return (
                      <Stack
                        key={month.month}
                        gap={2}
                        align="center"
                        flex={1}
                        h="full"
                        justify="end"
                        cursor="pointer"
                        role="button"
                        tabIndex={0}
                        aria-label={`Show games from ${month.name}`}
                        aria-pressed={selectedMonth === index}
                        onClick={() =>
                          setSelectedMonth((value) =>
                            value === index ? null : index,
                          )
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedMonth((value) =>
                              value === index ? null : index,
                            );
                          }
                        }}
                      >
                        <Text
                          fontSize="xs"
                          opacity={monthStats.completedGames ? 1 : 0.45}
                        >
                          {monthStats.completedGames}
                        </Text>
                        <Box
                          w="full"
                          maxW="34px"
                          h={height}
                          minH="3px"
                          borderRadius="sm"
                          bg={
                            selectedMonth === index
                              ? "orange.300"
                              : monthStats.completedGames
                                ? "teal.300"
                                : "whiteAlpha.300"
                          }
                          title={`${month.name}: ${monthStats.completedGames} completed`}
                        />
                        <Box
                          w="full"
                          maxW="34px"
                          h={`${Math.max((monthStats.droppedGames / maxDroppedCount) * 100, monthStats.droppedGames ? 8 : 2)}%`}
                          minH="3px"
                          borderRadius="sm"
                          bg="red.300"
                          title={`${month.name}: ${monthStats.droppedGames} dropped`}
                        />
                        <Text fontSize="xs" opacity={0.65}>
                          {MONTHS[index]}
                        </Text>
                      </Stack>
                    );
                  })}
                </Flex>
              </Box>

              <Box p={4} borderWidth="1px" borderRadius="lg">
                <Heading size="sm">Where you play</Heading>
                <Text fontSize="sm" opacity={0.65} mb={4}>
                  Completed / dropped in {periodLabel}
                </Text>
                <Stack gap={3} maxH="240px" overflowY="auto" pr={2}>
                  {periodByStore.map((store) => {
                    const totalGames =
                      store.completedGames + store.droppedGames;
                    const completedWidth =
                      totalGames > 0
                        ? `${(store.completedGames / totalGames) * 100}%`
                        : "0%";
                    const droppedWidth =
                      totalGames > 0
                        ? `${(store.droppedGames / totalGames) * 100}%`
                        : "0%";

                    return (
                      <Box
                        key={store.store}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedStore === store.store}
                        aria-label={`${selectedStore === store.store ? "Show all stores" : "Filter by"} ${store.store}`}
                        cursor="pointer"
                        p={2}
                        borderWidth="1px"
                        borderRadius="md"
                        borderColor={
                          selectedStore === store.store
                            ? "orange.300"
                            : "transparent"
                        }
                        bg={
                          selectedStore === store.store
                            ? "whiteAlpha.100"
                            : "transparent"
                        }
                        onClick={() =>
                          setSelectedStore((current) =>
                            current === store.store ? null : store.store,
                          )
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedStore((current) =>
                              current === store.store ? null : store.store,
                            );
                          }
                        }}
                      >
                        <Flex justify="space-between" fontSize="sm">
                          <Text>{store.store}</Text>
                          <Text fontWeight="bold">
                            {store.completedGames} / {store.droppedGames}
                          </Text>
                        </Flex>
                        <Box
                          mt={1}
                          h="6px"
                          bg="whiteAlpha.200"
                          borderRadius="full"
                          overflow="hidden"
                        >
                          <Flex
                            h="full"
                            w={`${(totalGames / Math.max(...periodByStore.map((item) => item.completedGames + item.droppedGames), 1)) * 100}%`}
                          >
                            <Box h="full" bg="orange.300" w={completedWidth} />
                            <Box h="full" bg="red.300" w={droppedWidth} />
                          </Flex>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </Grid>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={5}>
              <Box p={4} borderWidth="1px" borderRadius="lg">
                <Flex justify="space-between" align="start" gap={3} mb={4}>
                  <Box>
                    <Heading size="sm">Completion timeline</Heading>
                    <Text fontSize="sm" opacity={0.65}>
                      Games closed in {periodLabel}
                    </Text>
                  </Box>
                  {selectedMonth !== null && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setSelectedMonth(null)}
                    >
                      Show all
                    </Button>
                  )}
                </Flex>
                <Stack gap={2} maxH="340px" overflowY="auto">
                  {selectedTimeline.length ? (
                    selectedTimeline.map((game) => (
                      <Flex
                        key={`${game.igdbId}-${game.date}`}
                        justify="space-between"
                        gap={3}
                        p={2}
                        borderBottomWidth="1px"
                        borderColor="whiteAlpha.200"
                      >
                        <Box minW={0}>
                          <Text fontWeight="medium" truncate>
                            {game.title}
                          </Text>
                          <Text fontSize="xs" opacity={0.6}>
                            {game.store || "No store"}
                          </Text>
                        </Box>
                        <Box textAlign="right" flexShrink={0}>
                          <Flex align="center" justify="end" gap={2}>
                            {game.priority === "FAVORITE" && (
                              <Badge variant="subtle" colorPalette="orange">
                                Favorite
                              </Badge>
                            )}
                            <Badge
                              variant="subtle"
                              colorPalette={
                                game.status === "DROPPED" ? "red" : "green"
                              }
                            >
                              {game.status === "DROPPED"
                                ? "Dropped"
                                : "Completed"}
                            </Badge>
                            <Text fontSize="sm">
                              {new Date(game.date).toLocaleDateString()}
                            </Text>
                          </Flex>
                          <Text fontSize="xs" opacity={0.6}>
                            {game.estimatedHours ?? 0}h
                          </Text>
                        </Box>
                      </Flex>
                    ))
                  ) : (
                    <Text opacity={0.65}>
                      {selectedMonth === null
                        ? `No closed games in ${year}.`
                        : "No closed games in this month."}
                    </Text>
                  )}
                </Stack>
              </Box>

              <Box p={4} borderWidth="1px" borderRadius="lg">
                <Heading size="sm">Library status</Heading>
                <Text fontSize="sm" opacity={0.65} mb={4}>
                  Current state of your backlog
                </Text>
                <Stack gap={3}>
                  {stats.byStatus
                    .filter((status) => status.status !== "PLAYING")
                    .map((status) => {
                      const filter: LibraryFilter | null =
                        status.status === "COMPLETED" ||
                        status.status === "DROPPED"
                          ? status.status
                          : null;

                      if (filter) {
                        return (
                          <Button
                            key={status.status}
                            variant={
                              selectedLibraryFilter === filter
                                ? "solid"
                                : "outline"
                            }
                            w="full"
                            justifyContent="space-between"
                            aria-pressed={selectedLibraryFilter === filter}
                            onClick={() =>
                              setSelectedLibraryFilter((current) =>
                                current === filter ? null : filter,
                              )
                            }
                          >
                            <Text>{status.status.replaceAll("_", " ")}</Text>
                            <Badge>{status.count}</Badge>
                          </Button>
                        );
                      }

                      return (
                        <Flex
                          key={status.status}
                          justify="space-between"
                          align="center"
                          p={3}
                          borderWidth="1px"
                          borderRadius="md"
                        >
                          <Text>{status.status.replaceAll("_", " ")}</Text>
                          <Badge>{status.count}</Badge>
                        </Flex>
                      );
                    })}
                  <Button
                    variant={
                      selectedLibraryFilter === "FAVORITES"
                        ? "solid"
                        : "outline"
                    }
                    w="full"
                    justifyContent="space-between"
                    aria-pressed={selectedLibraryFilter === "FAVORITES"}
                    onClick={() =>
                      setSelectedLibraryFilter((current) =>
                        current === "FAVORITES" ? null : "FAVORITES",
                      )
                    }
                  >
                    <Text>FAVORITES</Text>
                    <Badge>{stats.summary.favoriteGames}</Badge>
                  </Button>
                  <Text fontSize="xs" opacity={0.6} mt={2}>
                    Currently dropped games: {stats.summary.droppedGames}. Their
                    estimated hours are excluded from the completed total.
                  </Text>
                </Stack>
              </Box>
            </Grid>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
