"use client";

import { GamesGrid } from "@/components/GamesGrid";
import NowPlaying from "@/components/NowPlaying";
import { QueuePanel } from "@/components/QueuePanel";
import Squares from "@/components/reactBits/Squares";
import SearchGameIgdb from "@/components/SearchGameIgdb";
import { SidebarStores } from "@/components/SidebarStores";
import Title from "@/components/Title";
import { Box, Flex, Grid, GridItem } from "@chakra-ui/react";
import { useState } from "react";

export default function Home() {
  // si tus componentes los necesitan:
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [gamesRefreshSignal, setGamesRefreshSignal] = useState(0);

  return (
    <Box minH="100vh" position="relative" overflow="hidden">
      {/* BACKGROUND */}
      <Box position="fixed" inset={0} zIndex={0} pointerEvents="none">
        <Squares
          speed={0.5}
          squareSize={40}
          direction="diagonal"
          borderColor="#271E37"
          hoverFillColor="#222222"
          // hoverColor="#222222"
          // size={40}
        />
      </Box>

      {/* CONTENT */}
      <Box position="relative" zIndex={1} p={6}>
        <Flex direction="row" justify={"space-between"} align="center">
          <Box flex={2}>
            <Title />
          </Box>

          <Box w={360}>
            <SearchGameIgdb
              onGameAdded={() => setGamesRefreshSignal((x) => x + 1)}
            />
          </Box>
        </Flex>

        <Grid templateColumns="260px 1fr 360px" gap={4} mt={6}>
          <GridItem>
            <SidebarStores
              selectedStore={selectedStore}
              onSelectStore={setSelectedStore}
            />
          </GridItem>

          <GridItem overflow="auto" pr={2}>
            <GamesGrid
              selectedStore={selectedStore}
              refreshSignal={gamesRefreshSignal}
              onQueueChanged={() => setRefreshSignal((x) => x + 1)}
            />
          </GridItem>

          <GridItem>
            <NowPlaying refreshSignal={refreshSignal} />
            <QueuePanel
              refreshSignal={refreshSignal}
              onQueueChanged={() => setRefreshSignal((x) => x + 1)}
            />
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
}
