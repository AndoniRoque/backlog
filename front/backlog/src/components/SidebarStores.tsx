"use client";

import { STORE_OPTIONS } from "@/lib/gameOptions";
import StoreIcon from "@/lib/storeIcons";
import { apiGet } from "@/lib/api";
import { Game } from "@/lib/types";
import {
  Box,
  Button,
  Heading,
  Portal,
  Stack,
  Text,
  Tooltip,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LuChartBar } from "react-icons/lu";

export function SidebarStores({
  selectedStore,
  onSelectStore,
  refreshSignal,
}: {
  selectedStore: string | null;
  onSelectStore: (store: string | null) => void;
  refreshSignal?: number;
}) {
  const router = useRouter();
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    let cancelled = false;

    apiGet<Game[]>("/games")
      .then((rows) => {
        if (!cancelled) setGames(rows);
      })
      .catch((error) => console.error(error));

    return () => {
      cancelled = true;
    };
  }, [refreshSignal]);

  const backlogGames = games.filter(
    (game) =>
      game.priority === "MUST_PLAY" || game.priority === "MAYBE_SOMEDAY",
  );
  const countForStore = (store: string) =>
    backlogGames.filter((game) => game.store === store).length;
  const gamesWithoutStore = backlogGames.filter((game) => !game.store).length;

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <Box
        mb={3}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        gap={2}
      >
        <Heading size="sm">Stores</Heading>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <Button
              size="xs"
              variant="ghost"
              aria-label="Open statistics"
              title="Statistics"
              onClick={() => router.push("/stats")}
            >
              <LuChartBar />
            </Button>
          </Tooltip.Trigger>
          <Portal>
            <Tooltip.Positioner>
              <Tooltip.Content>
                View statistics about your backlog
              </Tooltip.Content>
            </Tooltip.Positioner>
          </Portal>
        </Tooltip.Root>
      </Box>

      <Stack gap={2}>
        <Button
          variant={selectedStore === null ? "solid" : "outline"}
          onClick={() => onSelectStore(null)}
          justifyContent="space-between"
        >
          <Text>All </Text>
          <Text>({backlogGames.length})</Text>
        </Button>

        {STORE_OPTIONS.map((s) => (
          <Button
            key={s}
            variant={selectedStore === s ? "solid" : "outline"}
            onClick={() => onSelectStore(s)}
            justifyContent="space-between"
          >
            <StoreIcon name={s} />
            <Text>
              {s} ({countForStore(s)})
            </Text>
          </Button>
        ))}

        <Button
          variant={selectedStore === "__NONE__" ? "solid" : "outline"}
          onClick={() => onSelectStore("__NONE__")}
          justifyContent="space-between"
        >
          <Text>No store ({gamesWithoutStore})</Text>
        </Button>
      </Stack>
    </Box>
  );
}
