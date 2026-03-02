import { apiGet } from "@/lib/api";
import StoreIcon from "@/lib/storeIcons";
import { Game } from "@/lib/types";
import { Button, Collapsible, Flex, Text } from "@chakra-ui/react";
import { useState } from "react";

function RandomGame() {
  const [recomendation, setRecomendation] = useState<Game>();
  const [expanded, setExpanded] = useState(false);

  const getRandomGame = async () => {
    try {
      const randomGame: Game = await apiGet(`/recommend/random`);
      setRecomendation(randomGame);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Flex w={"full"} mt={2} direction={"column"} gap={2}>
      <Button w={"full"} fontWeight={"bold"} onClick={() => getRandomGame()}>
        Recommend Game
      </Button>
      {recomendation && (
        <Flex
          borderWidth="1px"
          borderRadius="lg"
          overflow="hidden"
          position="relative"
          p={4}
          mb={4}
          direction="column"
          cursor={recomendation?.summary ? "pointer" : "default"}
          role="button"
          tabIndex={0}
          onClick={() => {
            if (!recomendation.summary) return;
            setExpanded((v) => !v);
          }}
          onKeyDown={(e) => {
            if (!recomendation.summary) return;
            if (e.key === "Enter" || e.key === " ") setExpanded((v) => !v);
          }}
          bgImage={
            recomendation.coverUrl
              ? `url(${recomendation.coverUrl})`
              : undefined
          }
          bgRepeat="no-repeat"
          bgPos="center"
          bgSize="cover"
        >
          <Flex
            position="relative"
            zIndex={1}
            direction="column"
            gap={2}
            minH="160px"
          >
            <Flex justify={"flex-end"} align={"center"}>
              <Flex justify="flex-end" align="center">
                <StoreIcon name={recomendation?.store} />
              </Flex>
            </Flex>

            <Flex
              h={"full"}
              direction="column"
              justify={"center"}
              align={"space-between"}
              gap={2}
              mt={1}
              flex={1}
            >
              <Flex justify={"space-between"} align={"center"} h={"full"}>
                <Text fontWeight="bold" fontSize="xl" maxLines={2} flex={2}>
                  {recomendation?.title ?? "Nothing playing"}
                </Text>
              </Flex>

              {/* Summary: 1 línea cuando está cerrado + expansión animada */}
              {recomendation.summary ? (
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
                      {recomendation.summary}
                    </Text>
                  </Collapsible.Content>
                </Collapsible.Root>
              ) : (
                <Text fontSize="sm" opacity={0.8}>
                  No summary available.
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>
      )}
    </Flex>
  );
}

export default RandomGame;
