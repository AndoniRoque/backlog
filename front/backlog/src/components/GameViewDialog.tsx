"use client";

import { apiSend } from "@/lib/api";
import StoreIcon from "@/lib/storeIcons";
import type { Game } from "@/lib/types";
import {
  Badge,
  Button,
  Dialog,
  Flex,
  Icon,
  Image,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";

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
  onDeleted?: (igdbId: number) => void;
};

export default function GameViewDialog({
  open,
  onOpenChange,
  game,
  onDeleted,
}: Props) {
  const title = game?.title ?? "Game";

  const handleDelete = async () => {
    if (typeof game?.igdbId !== "number") return;

    try {
      await apiSend(`/games/${game.igdbId}`, "DELETE");
      onOpenChange(false);
      onDeleted?.(game.igdbId);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(d) => onOpenChange(d.open)}
      size="xl"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger />
          <Dialog.Header justifyContent={"space-between"}>
            <Dialog.Title>
              {title}{" "}
              {typeof game?.releaseYear === "number"
                ? `(${game.releaseYear})`
                : ""}
            </Dialog.Title>
            <Dialog.Description justifyContent={"end"} gap={2} mt={1}>
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
                    justify={"space-between"}
                  >
                    <Text fontWeight="semibold">Details</Text>
                    <Flex gap={2}>
                      <StoreIcon />
                    </Flex>
                  </Flex>
                  <InfoRow label="Developers" value={game?.developers} />
                  <InfoRow
                    label="Estimated hours"
                    value={`${game.estimatedHours ?? 0} hs.`}
                  />
                </Stack>

                <Flex gap={4} direction={{ base: "column", md: "row" }}>
                  <Stack gap={2} flex={1}>
                    <Text fontWeight="semibold">Summary</Text>
                    <Text fontSize="sm" opacity={0.9}>
                      {game.summary ?? "—"}
                    </Text>
                  </Stack>
                </Flex>
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
