import { igdbGames } from "../lib/igdbClient";

const BASE_URL = process.env.BASE_URL!;
const ARTWORK_URL = process.env.ARTWORK_URL!;

export async function searchGames(name: string) {
  const safe = name.replace(/"/g, '\\"');

  const query = `search "${safe}"; fields id, name, artworks, first_release_date, cover.image_id; limit 20;`;

  const games = await igdbGames(BASE_URL, query);

  return (games as any[]).map((game) => ({
    igdbId: game.id,
    title: game.name,
    summary: game.summary || "",
    releaseYear:
      typeof game.first_release_date === "number"
        ? new Date(game.first_release_date * 1000).getFullYear()
        : null,
    coverImageId: game.cover?.image_id || null,
    artworkIds: Array.isArray(game.artworks) ? game.artworks : [],
  }));
}

export async function fetchArtwork(id: number) {
  const query = `fields id, url, image_id; where id = ${id}; limit 1;`;
  const data = await igdbGames(BASE_URL, query);
  return data?.[0] ?? null;
}

export async function fetchArtworks(ids: number[]) {
  if (!ids.length) return [];
  const unique = Array.from(new Set(ids));

  const query = `fields id, url, image_id; where id = (${unique.join(",")}); limit ${unique.length};`;
  const data = await igdbGames(ARTWORK_URL, query);
  return data ?? [];
}

export function igdbImageUrl(imageId: string, size: string = "t_cover_big") {
  return `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;
}
