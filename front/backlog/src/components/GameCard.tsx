"use client";

import type { Game, GameStatus } from "@/lib/types";
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
import AddGameDialog from "./AddGameDialog";
import { PriorityOption, StatusOption, StoreOption } from "@/lib/gameOptions";
import { toaster } from "./ui/toaster";
import { apiSend } from "@/lib/api";
import { Tooltip } from "./ui/tooltip";

type Props = Game & {
  handleAddToQueue: (igdbId: number) => void;
  onGamePatched?: (updated: Game) => void;
  onGameDeleted?: (igdbId: number) => void;
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
    estimatedHours,
  } = props;

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formStore, setFormStore] = useState<StoreOption>(store as StoreOption);
  const [formPriority, setFormPriority] = useState<PriorityOption>(
    (priority as PriorityOption) ?? "MAYBE_SOMEDAY",
  );
  const [formStatus, setFormStatus] = useState<StatusOption>(
    status as StatusOption,
  );
  const [formHours, setFormHours] = useState<number | "">(estimatedHours ?? "");

  function openEdit() {
    // Poblar SIEMPRE desde props para evitar stale state
    setFormStore((store as StoreOption) ?? "Steam");
    setFormPriority((priority as PriorityOption) ?? "MAYBE_SOMEDAY");
    setFormStatus((status as StatusOption) ?? "BACKLOG");
    setFormHours(estimatedHours ?? "");
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
  }

  async function confirmEdit() {
    // si tu API edita por id:
    if (typeof igdbId !== "number") {
      toaster.create({ type: "error", description: "Missing game id" });
      return;
    }

    setSaving(true);
    try {
      await apiSend(`/games/${igdbId}`, "PATCH", {
        store: formStore,
        priority: formPriority,
        estimatedHours: formHours === "" ? null : formHours,
        status: formStatus,
      });

      props.onGamePatched?.({
        ...props,
        store: formStore,
        priority: formPriority,
        estimatedHours: formHours === "" ? null : formHours,
        status: formStatus as GameStatus,
      });

      toaster.create({ type: "success", description: `"${title}" updated!` });
      closeEdit();
    } catch (e: unknown) {
      toaster.create({
        type: "error",
        description: e instanceof Error ? e.message : "Failed to update game",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box p={3} borderWidth="1px" borderRadius="lg" position="relative">
      {/* store icon */}
      <Box position="absolute" top={2} right={2}>
        <StoreIcon name={store} />
      </Box>

      {/* top content */}
      <Flex gap={3} align="stretch">
        {/* text */}
        <Stack gap={2} minW={0} flex={1}>
          <VStack justify={"space-between"} h={"full"}>
            <Box>
              <Tooltip content={title}>
                <Text fontWeight="bold" truncate lineClamp="2">
                  {title}
                  {typeof releaseYear === "number" ? ` (${releaseYear})` : ""}
                </Text>
              </Tooltip>

              <HStack wrap="wrap" gap={2}>
                {priority ? (
                  <Badge>{priority.replaceAll("_", " ")}</Badge>
                ) : (
                  <Badge opacity={0.7}>No priority</Badge>
                )}
                <Badge>{status ?? "BACKLOG"}</Badge>
              </HStack>
            </Box>
            <Text w={"full"}>
              {estimatedHours ? estimatedHours + " Hours" : "-"}
            </Text>
          </VStack>
        </Stack>

        {/* cover */}
        <Box
          flexShrink={0}
          w={{ base: "92px", md: "110px" }}
          h={{ base: "128px", md: "148px" }}
          borderRadius="md"
          overflow="hidden"
          bg="blackAlpha.200"
        >
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={`${title} cover`}
              w="100%"
              h="100%"
              objectFit="cover"
            />
          ) : null}
        </Box>
      </Flex>

      {/* actions */}
      <Flex w="full" justify="space-between" gap={2} mt={3}>
        <IconButton
          aria-label="Edit game"
          variant="outline"
          size="sm"
          onClick={openEdit}
        >
          <EditIcon boxSize={3} />
        </IconButton>

        <IconButton
          aria-label="View game"
          variant="outline"
          size="sm"
          flex={1}
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
        onDeleted={props.onGameDeleted}
      />

      <AddGameDialog
        mode="edit"
        open={editOpen}
        onOpenChange={setEditOpen}
        game={props}
        store={formStore}
        onStoreChange={setFormStore}
        priority={formPriority}
        onPriorityChange={setFormPriority}
        status={formStatus}
        onStatusChange={setFormStatus}
        estimatedHours={formHours}
        onEstimatedHoursChange={setFormHours}
        onConfirm={confirmEdit}
        onCancel={closeEdit}
        isSaving={saving}
      />
    </Box>
  );
}
