// components/GlitchText.tsx
"use client";
import { Text } from "@chakra-ui/react";
import "../app/css/glitch.css";

export function GlitchText({ children }: { children: string }) {
  return (
    <Text
      className="glitch"
      data-text={children}
      fontSize="3xl"
      fontWeight="bold"
    >
      {children}
    </Text>
  );
}
