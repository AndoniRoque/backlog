"use client";

import { GamesGrid } from "@/components/GamesGrid";
import NowPlaying from "@/components/NowPlaying";
import { QueuePanel } from "@/components/QueuePanel";
import Squares from "@/components/reactBits/Squares";
import SearchGameIgdb from "@/components/SearchGameIgdb";
import { SidebarStores } from "@/components/SidebarStores";
import Title from "@/components/Title";

import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  HStack,
  Menu,
  Portal,
  Text,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";
import { STORE_OPTIONS } from "@/lib/gameOptions";

export default function Home() {
  const [selectedStore, setSelectedStore] = useState<string | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [gamesRefreshSignal, setGamesRefreshSignal] = useState(0);

  const handleQueueChanged = () => {
    setRefreshSignal((x) => x + 1);
    setGamesRefreshSignal((x) => x + 1);
  };

  const selectedStoreLabel = useMemo(() => {
    if (selectedStore === "__NONE__") return "No store";
    if (!selectedStore) return "All stores";
    return selectedStore;
  }, [selectedStore]);

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
        />
      </Box>

      {/* CONTENT */}
      <Box position="relative" zIndex={1} p={{ base: 4, md: 6 }}>
        {/* Header */}
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "stretch", md: "center" }}
          gap={{ base: 3, md: 0 }}
        >
          <Box>
            <Title />
          </Box>

          <Box w={{ base: "full", md: 360 }}>
            <SearchGameIgdb
              onGameAdded={() => setGamesRefreshSignal((x) => x + 1)}
            />
          </Box>
        </Flex>

        {/* Mobile store dropdown */}
        <HStack
          mt={4}
          justify="space-between"
          display={{ base: "flex", md: "none" }}
        >
          <Text fontSize="sm" opacity={0.8}>
            Store:
          </Text>

          <Menu.Root>
            <Menu.Trigger asChild>
              <Button variant="outline" size="sm">
                {selectedStoreLabel}
              </Button>
            </Menu.Trigger>

            <Portal>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item onClick={() => setSelectedStore(null)}>
                    All stores
                  </Menu.Item>

                  <Menu.Item onClick={() => setSelectedStore("__NONE__")}>
                    No store
                  </Menu.Item>

                  <Menu.Separator />

                  {STORE_OPTIONS.map((s) => (
                    <Menu.Item key={s} onClick={() => setSelectedStore(s)}>
                      {s}
                    </Menu.Item>
                  ))}
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </HStack>

        {/* Layout */}
        <Grid
          templateColumns={{
            base: "1fr",
            md: "260px 1fr 360px",
          }}
          gap={4}
          mt={6}
          alignItems="start"
        >
          {/* Sidebar (desktop only) */}
          <GridItem display={{ base: "none", md: "block" }}>
            <SidebarStores
              selectedStore={selectedStore}
              onSelectStore={setSelectedStore}
            />
          </GridItem>

          {/* Games */}
          <GridItem overflow="auto" pr={{ base: 0, md: 2 }}>
            <GamesGrid
              selectedStore={selectedStore}
              refreshSignal={gamesRefreshSignal}
              onQueueChanged={handleQueueChanged}
            />
          </GridItem>

          {/* Right panel: on mobile goes BELOW the grid items (because 1 column) */}
          <GridItem>
            <NowPlaying refreshSignal={refreshSignal} />

            {/* Queue al final */}
            <QueuePanel
              refreshSignal={refreshSignal}
              onQueueChanged={handleQueueChanged}
            />
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
}
