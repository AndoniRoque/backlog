import { igdbGames } from "../lib/igdbClient";

const BASE_URL = process.env.BASE_URL!;
const ARTWORK_URL = process.env.ARTWORK_URL!;

async function fetchArtworks(ids: number[]) {
  if (!ids.length) return [];
  const unique = Array.from(new Set(ids));

  const query = `fields id, url, image_id; where id = (${unique.join(",")}); limit ${unique.length};`;
  const data = await igdbGames(ARTWORK_URL, query);
  return data ?? [];
}

function igdbImageUrl(imageId: string, size: string = "t_cover_big") {
  return `https://images.igdb.com/igdb/image/upload/${size}/${imageId}.jpg`;
}

async function fetchDevelopers(involvedCompaniesIds: number[]) {
  if (!involvedCompaniesIds.length) return [];
  const unique = Array.from(new Set(involvedCompaniesIds)).slice(0, 500);

  const query = `fields developer, company.name; where id = (${unique.join(",")}); limit ${unique.length};`;
  const data = await igdbGames(process.env.INVOLVED_COMPANIES_URL!, query);
  return data ?? [];
}

export async function searchGames(name: string) {
  const safe = name.replace(/"/g, '\\"');

  const query = `search "${safe}"; fields id, name, artworks, first_release_date, cover.image_id, summary, involved_companies; limit 20;`;

  const games = await igdbGames(BASE_URL, query);

  const allArtworkIds: number[] = [];

  const allInvolvedCompaniesIds: number[] = [];

  for (const game of games) {
    if (Array.isArray(game.artworks)) allArtworkIds.push(...game.artworks);
    if (Array.isArray(game.involved_companies))
      allInvolvedCompaniesIds.push(...game.involved_companies);
  }

  const [artworks, involvedCompanies] = await Promise.all([
    fetchArtworks(allArtworkIds),
    fetchDevelopers(allInvolvedCompaniesIds),
  ]);

  const artworkById = new Map<number, any>();
  for (const artwork of artworks) artworkById.set(artwork.id, artwork);

  const involvedById = new Map<number, any>();
  for (const row of involvedCompanies) involvedById.set(row.id, row);

  return games.map((game: any) => {
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
      .map((a) => (a.image_id ? igdbImageUrl(a.image_id, "t_1080p") : null))
      .filter((u): u is string => Boolean(u));

    const heroUrl = artworksUrls[0] ?? null;

    const involvedIds: number[] = Array.isArray(game.involved_companies)
      ? game.involved_companies
      : [];

    const involvedResolved = involvedIds
      .map((id) => involvedById.get(id))
      .filter(Boolean)
      .map((row) => ({
        companyId: row.company?.id ?? null,
        companyName: row.company?.name ?? "Unknown",
        developer: !!row.developer,
      }));

    const developers = Array.from(
      new Set(
        involvedResolved.filter((x) => x.developer).map((x) => x.companyName),
      ),
    );

    return {
      igdbId: game.id,
      title: game.name,
      summary: game.summary,
      releaseYear,
      coverImageId: game.cover?.image_id ?? null,
      coverUrl,
      artworksUrls,
      heroUrl,
      developers,
    };
  });
}
