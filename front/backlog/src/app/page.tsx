import Title from "@/components/Title";
import { Flex } from "@chakra-ui/react";

export default function Home() {
  return (
    <Flex direction="column" align="start" justify="start" minHeight="100vh">
      <Title />
    </Flex>
  );
}
