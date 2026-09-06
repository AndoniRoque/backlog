"use client";

import { STORE_OPTIONS } from "@/lib/gameOptions";
import StoreIcon from "@/lib/storeIcons";
import { apiGet } from "@/lib/api";
import { Game } from "@/lib/types";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";

export function SidebarStores({
  selectedStore,
  onSelectStore,
  refreshSignal,
}: {
  selectedStore: string | null;
  onSelectStore: (store: string | null) => void;
  refreshSignal?: number;
}) {
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

  const countForStore = (store: string) =>
    games.filter((game) => game.store === store).length;
  const gamesWithoutStore = games.filter((game) => !game.store).length;

  return (
    <Box p={4} borderWidth="1px" borderRadius="lg">
      <Heading size="sm" mb={3}>
        Stores
      </Heading>

      <Stack gap={2}>
        <Button
          variant={selectedStore === null ? "solid" : "outline"}
          onClick={() => onSelectStore(null)}
          justifyContent="space-between"
        >
          <Text>All </Text>
          <Text>({games.length})</Text>
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
