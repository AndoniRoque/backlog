"use client";

import {
  Box,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";
import type { Game, QueueItem, StateResponse } from "@/lib/types";
import GameViewDialog from "./GameViewDialog";
import CompleteGameDialog from "./CompleteGameDialog";

import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableQueueRow({
  item,
  isFirst,
  onRemove,
  onOpen,
}: {
  item: QueueItem;
  isFirst: boolean;
  onRemove: (igdbId: number, isFirst: boolean) => void;
  onOpen: (igdbId: number) => void;
}) {
  const id = String(item.igdbId);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <HStack
      ref={setNodeRef}
      style={style}
      justify="space-between"
      p={2}
      borderWidth="1px"
      borderRadius="md"
      cursor={isDragging ? "grabbing" : "grab"}
      userSelect="none"
      _hover={{ bg: "blackAlpha.50" }}
      onClick={() => onOpen(item.igdbId)}
      {...attributes}
      {...listeners}
    >
      <Box minW={0} flex={1}>
        <Text fontWeight="bold" maxLines={1}>
          {item.title}
        </Text>
      </Box>

      {typeof item.igdbId === "number" && (
        <IconButton
          aria-label={isFirst ? "Complete & remove" : "Remove"}
          variant="ghost"
          size="sm"
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item.igdbId!, isFirst);
          }}
        >
          ×
        </IconButton>
      )}
    </HStack>
  );
}
export function QueuePanel({
  refreshSignal,
  onQueueChanged,
}: {
  refreshSignal: number;
  onQueueChanged?: () => void;
}) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [completingGame, setCompletingGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [, q] = await Promise.all([
        apiGet<StateResponse>("/state"),
        apiGet<QueueItem[]>("/queue"),
      ]);
      setQueue(q);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [refreshSignal]);

  async function removeOrComplete(igdbId: number) {
    const isHead = queue[0]?.igdbId === igdbId;

    if (isHead) {
      try {
        const game = await apiGet<Game>(`/games/${igdbId}`);
        setCompletingGame(game);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : "Failed to load game");
      }
      return;
    }

    await apiSend(`/queue/${igdbId}`, "DELETE");

    await load();

    onQueueChanged?.();
  }

  async function openGame(igdbId: number) {
    try {
      const game = await apiGet<Game>(`/games/${igdbId}`);
      setSelectedGame(game);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load game");
    }
  }

  // sensores (mouse/touch + teclado)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  // ids para SortableContext
  const ids = useMemo(() => queue.map((q) => String(q.igdbId)), [queue]);

  async function persistOrder(next: QueueItem[]) {
    // solo items con igdbId válido
    const igdbIds = next
      .map((x) => x.igdbId)
      .filter((x): x is number => typeof x === "number");

    // backend: PUT /queue { igdbIds }
    await apiSend("/queue", "PUT", { igdbIds });
  }

  return (
    <Stack gap={3}>
      <Box p={4} borderWidth="1px" borderRadius="lg">
        <HStack justify="space-between" mb={2}>
          <Heading size="sm">Play next...</Heading>
        </HStack>

        {err && (
          <Box p={3} borderWidth="1px" borderRadius="md" mb={2}>
            <Text fontWeight="bold">Error</Text>
            <Text>{err}</Text>
          </Box>
        )}

        {loading ? (
          <HStack>
            <Spinner size="sm" />
            <Text>Loading queue…</Text>
          </HStack>
        ) : queue.length ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={async (event) => {
              const { active, over } = event;
              if (!over) return;
              if (active.id === over.id) return;

              const oldIndex = ids.indexOf(String(active.id));
              const newIndex = ids.indexOf(String(over.id));
              if (oldIndex < 0 || newIndex < 0) return;

              const next = arrayMove(queue, oldIndex, newIndex);

              setQueue(next);

              try {
                await persistOrder(next);
                onQueueChanged?.();
              } catch (e) {
                // rollback si falla
                console.error(e);
                setQueue(queue);
              }
            }}
          >
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <Stack gap={2}>
                {queue.map((item, index) => (
                  <SortableQueueRow
                    key={item.igdbId ?? item.title}
                    item={item}
                    isFirst={index === 0}
                    onRemove={removeOrComplete}
                    onOpen={openGame}
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        ) : (
          <Text opacity={0.8}>Queue is empty.</Text>
        )}
      </Box>

      <GameViewDialog
        open={selectedGame !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedGame(null);
        }}
        game={selectedGame}
        onQueueChanged={() => {
          load();
          onQueueChanged?.();
        }}
      />

      <CompleteGameDialog
        open={completingGame !== null}
        game={completingGame}
        onOpenChange={(open) => {
          if (!open) setCompletingGame(null);
        }}
        onCompleted={async () => {
          setCompletingGame(null);
          await load();
          onQueueChanged?.();
        }}
      />
    </Stack>
  );
}
