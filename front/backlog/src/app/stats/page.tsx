"use client";

import Squares from "@/components/reactBits/Squares";
import { apiGet } from "@/lib/api";
import { PRIORITY_OPTIONS, STORE_OPTIONS } from "@/lib/gameOptions";
import {
  Badge,
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  NativeSelect,
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
    status: "COMPLETED" | "DROPPED";
  }[];
  byStore: { store: string; count: number }[];
  byStatus: { status: string; count: number }[];
  hours: { completedEstimated: number; droppedExcluded: boolean };
  filters: { store?: string; priority?: string };
};

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
  const [storeFilter, setStoreFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ year: String(year) });
    if (storeFilter) params.set("store", storeFilter);
    if (priorityFilter) params.set("priority", priorityFilter);

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
  }, [priorityFilter, storeFilter, year]);

  const selectedTimeline = useMemo(
    () =>
      stats?.completionTimeline.filter(
        (game) =>
          selectedMonth === null ||
          new Date(game.date).getUTCMonth() === selectedMonth,
      ) ?? [],
    [selectedMonth, stats],
  );

  const maxMonthlyCount = useMemo(
    () =>
      Math.max(
        ...(stats?.monthlyCompleted.map((month) => month.count) ?? [0]),
        1,
      ),
    [stats],
  );

  const maxDroppedCount = useMemo(
    () =>
      Math.max(
        ...(stats?.monthlyDropped.map((month) => month.count) ?? [0]),
        1,
      ),
    [stats],
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
            <NativeSelect.Root size="sm" w="150px">
              <NativeSelect.Field
                value={storeFilter}
                onChange={(event) => {
                  setSelectedMonth(null);
                  setStoreFilter(event.target.value);
                }}
              >
                <option value="">All stores</option>
                {STORE_OPTIONS.map((store) => (
                  <option key={store} value={store}>
                    {store}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <NativeSelect.Root size="sm" w="160px">
              <NativeSelect.Field
                value={priorityFilter}
                onChange={(event) => {
                  setSelectedMonth(null);
                  setPriorityFilter(event.target.value);
                }}
              >
                <option value="">All priorities</option>
                {PRIORITY_OPTIONS.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.replaceAll("_", " ")}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
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
                label="Completed"
                value={stats.summary.completedGames}
                detail={`games finished in ${year}`}
              />
              <StatCard
                label="Estimated hours"
                value={`${stats.summary.totalEstimatedHours}h`}
                detail="completed games only"
              />
              <StatCard
                label="Average length"
                value={`${stats.summary.averageEstimatedHours}h`}
                detail="per completed game"
              />
              <StatCard
                label="Still in backlog"
                value={stats.summary.backlogGames}
                detail={`${stats.summary.playingGames} currently playing`}
              />
            </Grid>

            <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap={5}>
              <Box p={4} borderWidth="1px" borderRadius="lg">
                <Flex justify="space-between" align="center" mb={5}>
                  <Box>
                    <Heading size="sm">Completion rhythm</Heading>
                    <Text fontSize="sm" opacity={0.65}>
                      Games finished month by month
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
                    const height = `${Math.max((month.count / maxMonthlyCount) * 100, month.count ? 8 : 2)}%`;
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
                        <Text fontSize="xs" opacity={month.count ? 1 : 0.45}>
                          {month.count}
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
                              : month.count
                                ? "teal.300"
                                : "whiteAlpha.300"
                          }
                          title={`${month.name}: ${month.count} games`}
                        />
                        <Box
                          w="full"
                          maxW="34px"
                          h={`${Math.max((stats.monthlyDropped[index].count / maxDroppedCount) * 100, stats.monthlyDropped[index].count ? 8 : 2)}%`}
                          minH="3px"
                          borderRadius="sm"
                          bg="red.300"
                          title={`${month.name}: ${stats.monthlyDropped[index].count} dropped`}
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
                  Completed games by store
                </Text>
                <Stack gap={3}>
                  {stats.byStore.length ? (
                    stats.byStore.map((store) => (
                      <Box key={store.store}>
                        <Flex justify="space-between" fontSize="sm">
                          <Text>{store.store}</Text>
                          <Text fontWeight="bold">{store.count}</Text>
                        </Flex>
                        <Box
                          mt={1}
                          h="6px"
                          bg="whiteAlpha.200"
                          borderRadius="full"
                          overflow="hidden"
                        >
                          <Box
                            h="full"
                            bg="orange.300"
                            w={`${(store.count / stats.summary.completedGames) * 100}%`}
                          />
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Text opacity={0.65}>No completed games in this year.</Text>
                  )}
                </Stack>
              </Box>
            </Grid>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={5}>
              <Box p={4} borderWidth="1px" borderRadius="lg">
                <Flex justify="space-between" align="start" gap={3} mb={4}>
                  <Box>
                    <Heading size="sm">Completion timeline</Heading>
                    <Text fontSize="sm" opacity={0.65}>
                      {selectedMonth === null
                        ? `Games closed in ${year}`
                        : `Games closed in ${stats.monthlyCompleted[selectedMonth].name}`}
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
                  {stats.byStatus.map((status) => (
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
                  ))}
                  <Text fontSize="xs" opacity={0.6} mt={2}>
                    Dropped games: {stats.summary.droppedGames}. Their estimated
                    hours are excluded from the completed total.
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
