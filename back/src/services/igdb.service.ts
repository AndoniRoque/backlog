import { igdbGames } from "../lib/igdbClient";

const BASE_URL = process.env.BASE_URL!;
const ARTWORK_URL = process.env.ARTWORK_URL!;

export async function fetchArtwork(id: number) {
  const query = `fields id, url, image_id; where id = ${id}; limit 1;`;
  const data = await igdbGames(ARTWORK_URL, query);
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

export async function searchGames(name: string) {
  const safe = name.replace(/"/g, '\\"');

  const query = `search "${safe}"; fields id, name, artworks, first_release_date, cover.image_id, summary, involved_companies; limit 20;`;

  const games = await igdbGames(BASE_URL, query);

  const allArtworkIds: number[] = [];

  for (const game of games) {
    if (Array.isArray(game.artworks)) {
      for (const id of game.artworks) allArtworkIds.push(id);
    }
  }

  const artworks = await fetchArtworks(allArtworkIds);

  const artworkById = new Map<number, any>();
  for (const artwork of artworks) artworkById.set(artwork.id, artwork);

  return games?.map((game: any) => {
    const releaseYear =
      typeof game.first_release_date === "number"
        ? new Date(game.first_release_date * 1000).getFullYear()
        : null;

    const coverUrl = game.cover?.image_id
      ? igdbImageUrl(game.cover.image_id, "t_cover_big")
      : null;

    const artworksIds: number[] = Array.isArray(game.artworks)
      ? game.artworks
      : [];

    const artworksUrls = artworksIds
      .map((id) => artworkById.get(id))
      .filter(Boolean)
      .map((a) => (a.image_id ? igdbImageUrl(a.image_id, "t_1080p") : null));

    const heroUrl = artworksUrls[0] ?? null;

    return {
      igdbId: game.id,
      title: game.name,
      summary: game.summary,
      releaseYear,
      coverImageId: game.cover?.image_id ?? null,
      coverUrl,
      artworksUrls,
      heroUrl,
      involvedCompanies: Array.isArray(game.involved_companies)
        ? game.involved_companies
        : [],
    };
  });
}
