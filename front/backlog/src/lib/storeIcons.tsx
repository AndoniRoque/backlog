import {
  EpicIcon,
  GOGIcon,
  ItchIoIcon,
  NintendoIcon,
  OriginIcon,
  PlaystationIcon,
  SteamIcon,
  UplayIcon,
  XboxIcon,
} from "@/components/Icons";
import { Box } from "@chakra-ui/react";

type Props = { name?: string | null | undefined };

export default function StoreIcon({ name }: Props) {
  let Icon = SteamIcon;

  switch (name) {
    case "Epic":
      Icon = EpicIcon;
      break;
    case "Xbox":
      Icon = XboxIcon;
      break;
    case "PlayStation":
      Icon = PlaystationIcon;
      break;
    case "Nintendo":
      Icon = NintendoIcon;
      break;
    case "GOG":
      Icon = GOGIcon;
      break;
    case "Origin":
      Icon = OriginIcon;
      break;
    case "Uplay":
      Icon = UplayIcon;
      break;
    case "Itch.io":
      Icon = ItchIoIcon;
      break;
    default:
      Icon = SteamIcon;
  }

  const whiteBgStores = ["Epic", "GOG", "Uplay", "Xbox"];

  return (
    <Box bg={whiteBgStores.includes(name ?? "") ? "#FFF" : "transparent"}>
      <Icon boxSize={5} opacity={0.9} />
    </Box>
  );
}
