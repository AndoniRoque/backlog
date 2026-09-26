"use client";

import {
  Button,
  Dialog,
  Field,
  Input,
  NativeSelect,
  Textarea,
} from "@chakra-ui/react";
import { useState } from "react";
import { apiSend } from "@/lib/api";
import type { Game } from "@/lib/types";

type Props = {
  open: boolean;
  game: Game | null;
  onOpenChange: (open: boolean) => void;
  onCompleted: (game: Game) => void;
};

function getTodayInputValue() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

export default function CompleteGameDialog({
  open,
  game,
  onOpenChange,
  onCompleted,
}: Props) {
  const [result, setResult] = useState<"FAVORITE" | "DONE" | "DROPPED">("DONE");
  const [personalNote, setPersonalNote] = useState("");
  const [completedAt, setCompletedAt] = useState(getTodayInputValue);
  const [saving, setSaving] = useState(false);
  const today = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date());

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setResult("DONE");
      setPersonalNote("");
      setCompletedAt(getTodayInputValue());
    }
    onOpenChange(nextOpen);
  }

  async function handleComplete() {
    if (!game || typeof game.igdbId !== "number") return;

    const completion = {
      DONE: { priority: "DONE", status: "COMPLETED" },
      FAVORITE: { priority: "FAVORITE", status: "COMPLETED" },
      DROPPED: { priority: "DONE", status: "DROPPED" },
    }[result];

    setSaving(true);
    try {
      const updated = await apiSend<Game>(
        `/queue/${game.igdbId}/complete`,
        "POST",
        {
          ...completion,
          personalNote,
          completedAt,
        },
      );
      onCompleted({ ...game, ...updated });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => handleOpenChange(details.open)}
      size="lg"
    >
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.CloseTrigger />
          <Dialog.Header>
            <Dialog.Title>Finish {game?.title ?? "game"}</Dialog.Title>
            <Dialog.Description>
              Choose the completion date. It defaults to today: {today}.
            </Dialog.Description>
          </Dialog.Header>
          <Dialog.Body>
            <Field.Root gap={2}>
              <Field.Label>Save as</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={result}
                  onChange={(event) =>
                    setResult(
                      event.target.value as "FAVORITE" | "DONE" | "DROPPED",
                    )
                  }
                >
                  <option value="DONE">Completed / Done</option>
                  <option value="FAVORITE">Favorite</option>
                  <option value="DROPPED">Dropped</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>

            <Field.Root gap={2} mt={4}>
              <Field.Label>Completion date</Field.Label>
              <Input
                type="date"
                value={completedAt}
                onChange={(event) => setCompletedAt(event.target.value)}
              />
            </Field.Root>

            <Field.Root gap={2} mt={4}>
              <Field.Label>Personal note</Field.Label>
              <Textarea
                value={personalNote}
                onChange={(event) => setPersonalNote(event.target.value)}
                placeholder="What did you think about it? Why did you leave it?"
                rows={5}
              />
            </Field.Root>
          </Dialog.Body>
          <Dialog.Footer>
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete} loading={saving}>
              Save completion
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
