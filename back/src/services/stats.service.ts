import { prisma } from "../prisma";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export async function getStatistics(
  year: number,
  filters: { store?: string; priority?: string } = {},
) {
  const games = await prisma.game.findMany({
    orderBy: [{ completedAt: "asc" }, { title: "asc" }],
  });

  const filteredGames = games.filter(
    (game) =>
      (!filters.store || (game.store?.trim() || "No store") === filters.store) &&
      (!filters.priority || game.priority === filters.priority),
  );

  const completedThisYear = filteredGames.filter(
    (game) =>
      game.status !== "DROPPED" &&
      (game.status === "COMPLETED" || game.priority === "DONE") &&
      game.completedAt !== null &&
      game.completedAt.getUTCFullYear() === year,
  );

  const closedThisYear = filteredGames.filter(
    (game) =>
      (game.status === "DROPPED" ||
        game.status === "COMPLETED" ||
        game.priority === "DONE") &&
      game.completedAt !== null &&
      game.completedAt.getUTCFullYear() === year,
  );

  const monthlyCompleted = MONTH_NAMES.map((name, index) => {
    const monthGames = completedThisYear.filter(
      (game) => game.completedAt!.getUTCMonth() === index,
    );

    return {
      month: index + 1,
      name,
      count: monthGames.length,
      hours: monthGames.reduce(
        (total, game) => total + (game.estimatedHours ?? 0),
        0,
      ),
    };
  });

  const monthlyDropped = MONTH_NAMES.map((name, index) => ({
    month: index + 1,
    name,
    count: closedThisYear.filter(
      (game) =>
        game.status === "DROPPED" && game.completedAt!.getUTCMonth() === index,
    ).length,
  }));

  const byStore = Object.entries(
    completedThisYear.reduce<Record<string, number>>((counts, game) => {
      const store = game.store?.trim() || "No store";
      counts[store] = (counts[store] ?? 0) + 1;
      return counts;
    }, {}),
  )
    .map(([store, count]) => ({ store, count }))
    .sort((a, b) => b.count - a.count || a.store.localeCompare(b.store));

  const byStatus = Object.entries(
    filteredGames.reduce<Record<string, number>>((counts, game) => {
      counts[game.status] = (counts[game.status] ?? 0) + 1;
      return counts;
    }, {}),
  )
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status));

  const totalHours = completedThisYear.reduce(
    (total, game) => total + (game.estimatedHours ?? 0),
    0,
  );

  return {
    year,
    summary: {
      completedGames: completedThisYear.length,
      totalEstimatedHours: totalHours,
      averageEstimatedHours:
        completedThisYear.length > 0
          ? Number((totalHours / completedThisYear.length).toFixed(1))
          : 0,
      backlogGames: filteredGames.filter((game) => game.status === "BACKLOG").length,
      playingGames: filteredGames.filter((game) => game.status === "PLAYING").length,
      droppedGames: filteredGames.filter((game) => game.status === "DROPPED").length,
    },
    monthlyCompleted,
    monthlyDropped,
    completionTimeline: closedThisYear.map((game) => ({
      date: game.completedAt!.toISOString(),
      igdbId: game.igdbId,
      title: game.title,
      store: game.store,
      estimatedHours: game.estimatedHours,
      status: game.status === "DROPPED" ? "DROPPED" : "COMPLETED",
    })),
    byStore,
    byStatus,
    hours: {
      completedEstimated: totalHours,
      droppedExcluded: true,
    },
    filters,
  };
}
