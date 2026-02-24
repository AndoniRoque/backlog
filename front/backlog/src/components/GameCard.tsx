"use client";

import type { Game } from "@/lib/types";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";

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
  coverUrl,
  handleAddToQueue,
}: Props) {
  return (
    <Box p={3} borderWidth="1px" borderRadius="lg">
      <Flex gap={2} direction={{ base: "column", md: "row" }} align="center">
        <Stack gap={2} flex={2}>
          <Text fontWeight="bold" maxLines={2}>
            {title}
            {typeof releaseYear === "number" ? ` (${releaseYear})` : ""}
          </Text>

          <HStack wrap="wrap">
            {store ? <Badge>{store}</Badge> : <Badge>NO STORE</Badge>}
            <Badge>{priority.replace("_", " ")}</Badge>
          </HStack>
        </Stack>

        {coverUrl && (
          <Image
            src={coverUrl}
            alt={`${title} cover`}
            objectFit="fill"
            aspectRatio={"auto"}
            maxH={32}
          />
        )}
      </Flex>
      <IconButton
        aria-label="Edit game"
        variant="outline"
        size="sm"
        mt={2}
        disabled={typeof igdbId !== "number"}
      />
      <IconButton
        onClick={() => {
          if (typeof igdbId === "number") handleAddToQueue(igdbId);
        }}
        aria-label="add to queue"
        variant="outline"
        size="sm"
        mt={2}
      >
        +
      </IconButton>
    </Box>
  );
}
