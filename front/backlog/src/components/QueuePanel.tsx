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
import type { QueueItem, StateResponse } from "@/lib/types";

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
}: {
  item: QueueItem;
  isFirst: boolean;
  onRemove: (igdbId: number, isFirst: boolean) => void;
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
          onClick={() => onRemove(item.igdbId!, isFirst)}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
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
  const [nowPlaying, setNowPlaying] =
    useState<StateResponse["nowPlaying"]>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      const [state, q] = await Promise.all([
        apiGet<StateResponse>("/state"),
        apiGet<QueueItem[]>("/queue"),
      ]);
      setNowPlaying(state.nowPlaying ?? null);
      setQueue(q);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to load queue");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  async function removeOrComplete(igdbId: number) {
    await apiSend(`/queue/${igdbId}`, "DELETE");

    await load();

    onQueueChanged?.();
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
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        ) : (
          <Text opacity={0.8}>Queue is empty.</Text>
        )}
      </Box>
    </Stack>
  );
}
