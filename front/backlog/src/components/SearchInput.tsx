"use client";
import {
  Button,
  HStack,
  IconButton,
  Input,
  Menu,
  Portal,
} from "@chakra-ui/react";
import { IoFilterCircleOutline } from "react-icons/io5";

export type SortBy = "title" | "releaseYear" | "estimatedHours";
export type SortDir = "asc" | "desc";

type Props = {
  title: string;
  onTitleChange: (next: string) => void;
  sortBy: SortBy;
  sortDir: SortDir;
  onSortChange: (next: { sortBy: SortBy; sortDir: SortDir }) => void;
};

function sortLabel(sortBy: SortBy, sortDir: SortDir) {
  const arrow = sortDir === "asc" ? "↑" : "↓";
  if (sortBy === "title") return `Title ${arrow}`;
  if (sortBy === "releaseYear") return `Year ${arrow}`;
  return `Hours ${arrow}`;
}

export default function SearchInput({
  title,
  onTitleChange,
  sortBy,
  sortDir,
  onSortChange,
}: Props) {
  const isDefault = sortBy === "title" && sortDir === "asc";
  return (
    <HStack gap={0} w={200}>
      <Input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Search by title…"
        w={{ base: "full", md: "xs" }}
      />

      <Menu.Root>
        <Menu.Trigger asChild>
          <IconButton aria-label="Sort games" size="sm" bg={"transparent"}>
            <IoFilterCircleOutline color="gray" />
          </IconButton>
        </Menu.Trigger>

        <Portal>
          <Menu.Positioner>
            <Menu.Content>
              <Menu.ItemGroup>
                <Menu.Item
                  value="title asc"
                  onClick={() =>
                    onSortChange({ sortBy: "title", sortDir: "asc" })
                  }
                >
                  Title (A → Z)
                </Menu.Item>
                <Menu.Item
                  value="title desc"
                  onClick={() =>
                    onSortChange({ sortBy: "title", sortDir: "desc" })
                  }
                >
                  Title (Z → A)
                </Menu.Item>

                <Menu.Separator />

                <Menu.Item
                  value="releaseYear desc"
                  onClick={() =>
                    onSortChange({ sortBy: "releaseYear", sortDir: "desc" })
                  }
                >
                  Release year (new → old)
                </Menu.Item>

                <Menu.Item
                  value="releaseYear asc"
                  onClick={() =>
                    onSortChange({ sortBy: "releaseYear", sortDir: "asc" })
                  }
                >
                  Release year (old → new)
                </Menu.Item>

                <Menu.Separator />

                <Menu.Item
                  value="estimatedHours asc"
                  onClick={() =>
                    onSortChange({ sortBy: "estimatedHours", sortDir: "asc" })
                  }
                >
                  Estimated hours (low → high)
                </Menu.Item>
                <Menu.Item
                  value="estimatedHours desc"
                  onClick={() =>
                    onSortChange({ sortBy: "estimatedHours", sortDir: "desc" })
                  }
                >
                  Estimated hours (high → low)
                </Menu.Item>
              </Menu.ItemGroup>
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </HStack>
  );
}
