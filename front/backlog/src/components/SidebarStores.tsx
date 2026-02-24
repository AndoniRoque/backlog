"use client";

import { STORE_OPTIONS } from "@/lib/gameOptions";
import { Box, Button, Heading, Stack, Text } from "@chakra-ui/react";

export function SidebarStores({
  selectedStore,
  onSelectStore,
}: {
  selectedStore: string | null;
  onSelectStore: (store: string | null) => void;
}) {
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
          <Text>All</Text>
        </Button>

        {STORE_OPTIONS.map((s) => (
          <Button
            key={s}
            variant={selectedStore === s ? "solid" : "outline"}
            onClick={() => onSelectStore(s)}
            justifyContent="space-between"
          >
            <Text>{s}</Text>
          </Button>
        ))}

        <Button
          variant={selectedStore === "__NONE__" ? "solid" : "outline"}
          onClick={() => onSelectStore("__NONE__")}
          justifyContent="space-between"
        >
          <Text>No store</Text>
        </Button>
      </Stack>
    </Box>
  );
}
