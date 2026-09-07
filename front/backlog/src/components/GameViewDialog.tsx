"use client";

import { apiGet, apiSend } from "@/lib/api";
import StoreIcon from "@/lib/storeIcons";
import type { Game, GameActivity } from "@/lib/types";
import {
  Badge,
  Box,
  Button,
  Dialog,
  Flex,
  Image,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined | string[];
}) {
  const shown =
    value === null || value === undefined || value === ""
      ? "—"
      : Array.isArray(value)
        ? value.length
          ? value.join(", ")
          : "—"
        : String(value);

  return (
    <Flex justify="space-between" gap={4}>
      <Text fontSize="sm" opacity={0.7}>
        {label}
      </Text>
      <Text fontSize="sm" textAlign="right" maxW="70%" wordBreak="break-word">
        {shown}
      </Text>
    </Flex>
  );
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  game: Game | null;
  onAddToQueue?: (igdbId: number) => void;
  onQueueChanged?: () => void;
  onDeleted?: (igdbId: number) => void;
};

export default function GameViewDialog({
  open,
  onOpenChange,
  game,
  onQueueChanged,
  onDeleted,
}: Props) {
  const title = game?.title ?? "Game";
  const [activity, setActivity] = useState<GameActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (!open || typeof game?.igdbId !== "number") {
      setActivity([]);
      return;
    }

    let cancelled = false;
    setActivityLoading(true);
    apiGet<GameActivity[]>(`/games/${game.igdbId}/activity`)
      .then((items) => {
        if (!cancelled) setActivity(items);
      })
      .catch((error) => console.error(error))
      .finally(() => {
        if (!cancelled) setActivityLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [game?.igdbId, open]);

  const handleDelete = async () => {
    if (typeof game?.igdbId !== "number") return;

    try {
      await apiSend(`/games/${game.igdbId}`, "DELETE");
      onDeleted?.(game.igdbId);
      onQueueChanged?.();
      onOpenChange(false);
      await Promise.all([apiGet("/state"), apiGet("/queue")]);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onOpenChange(details.open)}
      size="xl"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger />
          <Dialog.Header justifyContent="space-between">
            <Dialog.Title>
              {title}{" "}
              {typeof game?.releaseYear === "number"
                ? `(${game.releaseYear})`
                : ""}
            </Dialog.Title>
            <Dialog.Description justifyContent="end" gap={2} mt={1}>
              <Badge>{game?.priority.replace("_", " ") ?? "—"}</Badge>
              <Badge>{game?.igdbId}</Badge>
            </Dialog.Description>
          </Dialog.Header>

          <Dialog.Body>
            {!game ? (
              <Text fontSize="sm">—</Text>
            ) : (
              <Stack gap={4}>
                {game.heroUrl && (
                  <Image
                    src={game.heroUrl}
                    alt={`${title} hero`}
                    w="100%"
                    maxH="320px"
                    objectFit="cover"
                    borderRadius="lg"
                  />
                )}

                <Separator />

                <Stack gap={2}>
                  <Flex
                    gap={2}
                    align="center"
                    wrap="wrap"
                    justify="space-between"
                  >
                    <Text fontWeight="semibold">Details</Text>
                    <StoreIcon name={game.store} />
                  </Flex>
                  <InfoRow label="Developers" value={game.developers} />
                  <InfoRow
                    label="Estimated hours"
                    value={`${game.estimatedHours ?? 0} hs.`}
                  />
                  <InfoRow
                    label="Completed"
                    value={
                      game.completedAt
                        ? new Date(game.completedAt).toLocaleDateString()
                        : null
                    }
                  />
                </Stack>

                <Stack gap={2}>
                  <Text fontWeight="semibold">Summary</Text>
                  <Text fontSize="sm" opacity={0.9}>
                    {game.summary ?? "—"}
                  </Text>
                </Stack>

                <Stack gap={2}>
                  <Text fontWeight="semibold">Personal note</Text>
                  <Text
                    fontSize="sm"
                    opacity={game.personalNote ? 0.9 : 0.6}
                    whiteSpace="pre-wrap"
                  >
                    {game.personalNote || "No personal note yet."}
                  </Text>
                </Stack>

                <Stack gap={3}>
                  <Text fontWeight="semibold">Activity history</Text>
                  {activityLoading ? (
                    <Text fontSize="sm" opacity={0.6}>
                      Loading history...
                    </Text>
                  ) : activity.length ? (
                    activity.map((event) => (
                      <Box key={event.id} pl={3} borderLeftWidth="2px">
                        <Flex justify="space-between" gap={3}>
                          <Text fontSize="sm" fontWeight="medium">
                            {event.type.replaceAll("_", " ")}
                          </Text>
                          <Text fontSize="xs" opacity={0.6} flexShrink={0}>
                            {new Date(event.createdAt).toLocaleString()}
                          </Text>
                        </Flex>
                        {event.detail && (
                          <Text fontSize="sm" opacity={0.7} mt={1}>
                            {event.detail}
                          </Text>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Text fontSize="sm" opacity={0.6}>
                      No activity recorded yet.
                    </Text>
                  )}
                </Stack>
              </Stack>
            )}
          </Dialog.Body>
          <Dialog.Footer>
            <Button variant="subtle" onClick={handleDelete}>
              Delete
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
