"use client";

import type { Game } from "@/lib/types";
import { Badge, Box, Button, HStack, Stack, Text } from "@chakra-ui/react";

type Props = Game & {
  handleAddToQueue: (igdbId: number) => void;
};

export default function GameCard({
  igdbId,
  title,
  releaseYear,
  status,
  priority,
  store,
  handleAddToQueue,
}: Props) {
  return (
    <Box p={3} borderWidth="1px" borderRadius="lg">
      <Stack gap={2}>
        <Text fontWeight="bold" maxLines={2}>
          {title}
          {typeof releaseYear === "number" ? ` (${releaseYear})` : ""}
        </Text>

        <HStack wrap="wrap">
          <Badge>{status}</Badge>
          <Badge>{priority}</Badge>
          {store ? <Badge>{store}</Badge> : <Badge>NO STORE</Badge>}
        </HStack>

        <Button
          size="sm"
          onClick={() => {
            if (typeof igdbId === "number") handleAddToQueue(igdbId);
          }}
          disabled={typeof igdbId !== "number"}
        >
          Add to Queue
        </Button>
      </Stack>
    </Box>
  );
}
