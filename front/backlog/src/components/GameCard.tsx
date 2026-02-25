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
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import GameViewDialog from "./GameViewDialog";
import StoreIcon from "@/lib/storeIcons";

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
    status,
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

          <VStack wrap="wrap" align={"start"}>
            <HStack>
              <VStack wrap="wrap" align={"start"}>
                <Badge>{priority?.replaceAll("_", " ")}</Badge>
                <Badge>{status ?? "BACKLOG"}</Badge>
              </VStack>
            </HStack>
          </VStack>
        </Stack>

        <Box position={"relative"}>
          <Box position={"absolute"} right={1}>
            <StoreIcon name={store} />
          </Box>
          {coverUrl && (
            <Image
              src={coverUrl}
              alt={`${title} cover`}
              objectFit="cover"
              maxH={32}
              borderRadius="md"
            />
          )}
        </Box>
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
