"use client";

import { PRIORITY_OPTIONS, STORE_OPTIONS } from "@/lib/gameOptions";
import type { Game } from "@/lib/types";
import { Button, Dialog, Field, Input, NativeSelect } from "@chakra-ui/react";

export type StoreOption = (typeof STORE_OPTIONS)[number];
export type PriorityOption = (typeof PRIORITY_OPTIONS)[number];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  game: Game | null;

  store: StoreOption;
  onStoreChange: (v: StoreOption) => void;

  priority: PriorityOption;
  onPriorityChange: (v: PriorityOption) => void;

  estimatedHours: number | "";
  onEstimatedHoursChange: (v: number | "") => void;

  onConfirm: () => void;
  onCancel: () => void;

  isSaving?: boolean;
};

export default function AddGameDialog({
  open,
  onOpenChange,
  game,
  store,
  onStoreChange,
  priority,
  onPriorityChange,
  estimatedHours,
  onEstimatedHoursChange,
  onConfirm,
  onCancel,
  isSaving,
}: Props) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(d) => onOpenChange(d.open)}
      size="md"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger onClick={onCancel} />
          <Dialog.Header>
            <Dialog.Title>
              Add to Queue {game?.title ? `— ${game.title}` : ""}
            </Dialog.Title>
          </Dialog.Header>

          <Dialog.Body>
            <Field.Root mb="4">
              <Field.Label>Store</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={store}
                  onChange={(e) => onStoreChange(e.target.value as StoreOption)}
                >
                  {STORE_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>

            <Field.Root mb="4">
              <Field.Label>Priority</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={priority}
                  onChange={(e) =>
                    onPriorityChange(e.target.value as PriorityOption)
                  }
                >
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p.replaceAll("_", " ")}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>

            <Field.Root>
              <Field.Label>Estimated hours (optional)</Field.Label>
              <Input
                inputMode="numeric"
                value={estimatedHours}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw.trim() === "") return onEstimatedHoursChange("");
                  const n = Number(raw);
                  onEstimatedHoursChange(Number.isFinite(n) ? n : "");
                }}
                placeholder="e.g. 12"
              />
            </Field.Root>
          </Dialog.Body>

          <Dialog.Footer gap="2">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              colorPalette="blue"
              onClick={onConfirm}
              loading={!!isSaving}
              disabled={!game || typeof game.igdbId !== "number"}
            >
              Add
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
