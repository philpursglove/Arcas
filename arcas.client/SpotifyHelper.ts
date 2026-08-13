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