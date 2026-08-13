export function generateRandomString(length: number = 64): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = crypto.getRandomValues(new Uint8Array(length));
    return values.reduce((acc, x) => acc + possible[x % possible.length], "");
}

export async function sha256(plainText: string): Promise<ArrayBuffer> {
    const encoder = new TextEncoder()
    const data = encoder.encode(plainText)
    return window.crypto.subtle.digest('SHA-256', data)
}

export function base64encode(input: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(input)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

export async function getSpotifyClientId(): Promise<string>      {
    const response = await fetch('Spotify/getclientid');
    if (!response.ok) 
    {
        return '';
    }
    const apiKey = await response.json();
    return apiKey;
}

// PKCE functions for Spotify authorization

export function generateCodeVerifier(): string {
    return generateRandomString(128);
}

export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
    const hashed = await sha256(codeVerifier);
    return base64encode(hashed);
}

export async function redirectToSpotifyAuth(clientId: string, redirectUri: string): Promise<void> {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateRandomString(16);

    // Store code verifier and state for later verification
    localStorage.setItem('spotify_code_verifier', codeVerifier);
    localStorage.setItem('spotify_auth_state', state);

    const params = new URLSearchParams({
        client_id: clientId,
        response_type: 'code',
        redirect_uri: redirectUri,
        state: state,
        scope: 'playlist-modify-public playlist-modify-private',
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
    });

    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export function parseCallbackUrl(): { code: string; state: string } | null {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const storedState = localStorage.getItem('spotify_auth_state');

    if (!code || !state || state !== storedState) {
        return null;
    }

    return { code, state };
}

// Token management functions

interface SpotifyToken {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
}

export function saveSpotifyToken(accessToken: string, expiresIn: number, refreshToken?: string): void {
    const token: SpotifyToken = {
        accessToken,
        refreshToken,
        expiresAt: Date.now() + expiresIn * 1000,
    };
    localStorage.setItem('spotify_token', JSON.stringify(token));
    // Clean up auth state after successful token exchange
    localStorage.removeItem('spotify_code_verifier');
    localStorage.removeItem('spotify_auth_state');
}

export function getSpotifyToken(): string | null {
    const tokenStr = localStorage.getItem('spotify_token');
    if (!tokenStr) return null;

    try {
        const token: SpotifyToken = JSON.parse(tokenStr);
        // Check if token is expired (with 5 minute buffer)
        if (Date.now() >= token.expiresAt - 300000) {
            clearSpotifyToken();
            return null;
        }
        return token.accessToken;
    } catch {
        return null;
    }
}

export function clearSpotifyToken(): void {
    localStorage.removeItem('spotify_token');
}

export function getCodeVerifier(): string | null {
    return localStorage.getItem('spotify_code_verifier');
}