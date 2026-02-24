"use client";

import type { Game } from "@/lib/types";
import { EditIcon, ViewIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  Image,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useState } from "react";
import GameViewDialog from "./GameViewDialog";

type Props = Game & {
  handleAddToQueue: (igdbId: number) => void;
};

export default function GameCard(props: Props) {
  const {
    igdbId,
    title,
    releaseYear,
    priority,
    store,
    coverUrl,
    handleAddToQueue,
  } = props;

  const [open, setOpen] = useState(false);

  return (
    <Box p={3} borderWidth="1px" borderRadius="lg">
      <Flex gap={2} direction={{ base: "column", md: "row" }} align="center">
        <Stack gap={2} flex={2}>
          <Text fontWeight="bold" maxLines={2}>
            {title}
            {typeof releaseYear === "number" ? ` (${releaseYear})` : ""}
          </Text>

          <HStack wrap="wrap">
            <Badge>{priority?.replaceAll("_", " ")}</Badge>
            <Badge>{store ?? "NO STORE"}</Badge>
          </HStack>
        </Stack>

        {coverUrl && (
          <Image
            src={coverUrl}
            alt={`${title} cover`}
            objectFit="cover"
            maxH={32}
            borderRadius="md"
          />
        )}
      </Flex>

      <Flex w="full" justify="space-between" gap={2} mt={2}>
        <IconButton aria-label="Edit game" variant="outline" size="sm">
          <EditIcon boxSize={3} />
        </IconButton>

        <IconButton
          aria-label="View game"
          variant="outline"
          size="sm"
          flex={2}
          onClick={() => setOpen(true)}
        >
          <ViewIcon />
        </IconButton>

        <IconButton
          onClick={() => {
            if (typeof igdbId === "number") handleAddToQueue(igdbId);
          }}
          aria-label="add to queue"
          variant="outline"
          size="sm"
        >
          +
        </IconButton>
      </Flex>

      <GameViewDialog
        open={open}
        onOpenChange={setOpen}
        game={props}
        onAddToQueue={handleAddToQueue}
      />
    </Box>
  );
}
