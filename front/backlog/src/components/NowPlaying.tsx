"use client";

import { api } from "@/lib/api";
import type { Game } from "@/lib/types";
import { Flex, Text, Box, Badge, Collapsible } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Tooltip } from "./ui/tooltip";

export default function NowPlaying() {
  const [game, setGame] = useState<Game | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchNowPlaying = async () => {
      try {
        const res = await api.get("/state");
        setGame(res.data.nowPlaying ?? null);
        setExpanded(false); // si cambia el juego, colapsa
      } catch (error) {
        console.error("Error fetching now playing game:", error);
      }
    };
    fetchNowPlaying();
  }, []);

  const hero = game?.heroUrl || game?.coverUrl || null;
  const summary = game?.summary?.trim() ?? "";

  return (
    <Flex
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      position="relative"
      p={4}
      mb={4}
      direction="column"
      minH="160px"
      bgImage={hero ? `url(${hero})` : undefined}
      bgSize="cover"
      bgPos="center"
      cursor={game?.summary ? "pointer" : "default"}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (!summary) return;
        setExpanded((v) => !v);
      }}
      onKeyDown={(e) => {
        if (!summary) return;
        if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v);
      }}
    >
      {/* overlay para legibilidad */}
      <Box position="absolute" inset={0} bg="blackAlpha.700" />

      {/* contenido arriba del overlay */}
      <Tooltip
        content={
          game
            ? `${game.summary ?? ""} (${game.store ?? ""})`
            : "Nothing playing"
        }
      >
        <Flex position="relative" zIndex={1} direction="column" gap={2}>
          <Text fontWeight="bold" fontSize="xs" opacity={0.5}>
            Now Playing...
          </Text>

          <Flex direction="column" gap={2} mt={1} flex={1}>
            <Text fontWeight="bold" fontSize="xl" maxLines={2}>
              {game?.title ?? "Nothing playing"}
            </Text>

            {/* Summary: 1 línea cuando está cerrado + expansión animada */}
            {summary ? (
              <Collapsible.Root
                open={expanded}
                onOpenChange={(e) => setExpanded(e.open)}
              >
                <Collapsible.Content
                  _closed={{
                    shadow: "inset 0 -12px 12px -12px var(--shadow-color)",
                    shadowColor: "rgba(0, 0, 0, 0.7)",
                  }}
                >
                  <Text fontSize="sm" opacity={0.9} mt={2}>
                    {summary}
                  </Text>
                </Collapsible.Content>
              </Collapsible.Root>
            ) : (
              <Text fontSize="sm" opacity={0.8}>
                No summary available.
              </Text>
            )}

            <Flex w="full" justify="flex-end" align="end">
              {game?.store && <Badge opacity={0.9}>{game.store}</Badge>}
            </Flex>
          </Flex>
        </Flex>
      </Tooltip>
    </Flex>
  );
}
