import axios from "axios";

const CLIENT_ID = process.env.CLIENT_ID;
const TOKEN_URL = process.env.TOKEN_URL!;
const SECRET = process.env.SECRET;

let accessToken: string | null = null;
let expiresAtMs: number = 0;

function assertEnv() {
  const missing = ["CLIENT_ID", "SECRET", "TOKEN_URL", "BASE_URL"].filter(
    (key) => !process.env[key],
  );
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }
}

async function refreshToken() {
  try {
    const response = await axios.post(TOKEN_URL, null, {
      params: {
        client_id: CLIENT_ID!,
        client_secret: SECRET!,
        grant_type: "client_credentials",
      },
    });
    accessToken = response.data.access_token;
    const expiresInSec = response.data.expires_in ?? 3600;
    expiresAtMs = Date.now() + expiresInSec * 1000;
  } catch (error) {
    console.error("Error refreshing access token:", error);
    accessToken = null;
    expiresAtMs = 0;
  }
}

async function getValidToken() {
  if (!accessToken || Date.now() > expiresAtMs - 60_000) {
    await refreshToken();
  }
  return accessToken!;
}

export async function igdbGames(url: string, body: string) {
  assertEnv();
  const token = await getValidToken();
  const response = await axios.post(url, body, {
    headers: {
      "Client-ID": CLIENT_ID!,
      Authorization: `Bearer ${token}`,
    },
    timeout: 10_000,
  });
  return response.data;
}
