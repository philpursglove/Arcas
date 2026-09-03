using Arcas.Server.DTO.Inbound;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace Arcas.Server.Services
{
    public class SpotifyService
    {
        private readonly ApiKeys _apiKeys;
        private readonly HttpClient _httpClient;
        private readonly IMemoryCache _cache;
        private const string SpotifyBearerTokenCacheKey = "SpotifyBearerToken";

        public SpotifyService(IOptions<ApiKeys> options, HttpClient httpClient, IMemoryCache memoryCache)
        {
            _apiKeys = options.Value;
            _httpClient = httpClient;
            _cache = memoryCache;

            _httpClient.BaseAddress = new Uri("https://api.spotify.com/v1/");
            _httpClient.Timeout = TimeSpan.FromSeconds(30);

            var token = GetSpotifyBearerToken().Result;
            _httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        }

        private async Task<string> GetSpotifyBearerToken()
        {
            if (_cache.TryGetValue(SpotifyBearerTokenCacheKey, out object? cachedValue))
            {
                return (string)cachedValue;
            }

            var httpClient = new HttpClient();

            var result = await httpClient.PostAsync("https://accounts.spotify.com/api/token",
                new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("grant_type", "client_credentials"),
                    new KeyValuePair<string, string>("client_id", _apiKeys.SpotifyClientId),
                    new KeyValuePair<string, string>("client_secret", _apiKeys.SpotifyClientSecret)
                }));

            if (!result.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to get Spotify bearer token: {result.ReasonPhrase}");
            }

            var content = await result.Content.ReadAsStringAsync();
            var tokenResult = JsonSerializer.Deserialize<SpotifyAccessTokenResult>(content);

            _cache.Set(SpotifyBearerTokenCacheKey, tokenResult.Token, new TimeSpan(0, 55, 0));

            return tokenResult.Token;
        }

        public async Task<DTO.Outbound.SpotifyTrack> SearchTrack(string artistName, string trackName)
        {
            var response = await _httpClient.GetAsync(
                $"search?q=artist:{Uri.EscapeDataString(artistName)}%20track:{Uri.EscapeDataString(trackName)}&type=track");
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Failed to search tracks: {response.ReasonPhrase}");
            }

            var content = await response.Content.ReadAsStringAsync();
            var searchResult = JsonSerializer.Deserialize<SpotifyTrackSearchResult>(content);
            if (searchResult.Tracks.Items.Any())
            {
                return searchResult.Tracks.Items.Where(t => t.Playable && !t.Local)
                    .Select(t => new DTO.Outbound.SpotifyTrack { SpotifyUri = t.SpotifyUri, Name = t.Name })
                    .FirstOrDefault(t => t.Name.ToLowerInvariant().StartsWith(trackName.ToLowerInvariant()));
            }

            return new DTO.Outbound.SpotifyTrack { SpotifyUri = "fail", Name = trackName };

        }

        public string GetClientId()
        {
            return _apiKeys.SpotifyClientId;
        }

        public async Task<SpotifyAccessTokenResult> ExchangeCodeForToken(string code, string codeVerifier, string redirectUri)
        {
            var httpClient = new HttpClient();

            var result = await httpClient.PostAsync("https://accounts.spotify.com/api/token",
                new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("grant_type", "authorization_code"),
                    new KeyValuePair<string, string>("code", code),
                    new KeyValuePair<string, string>("redirect_uri", redirectUri),
                    new KeyValuePair<string, string>("client_id", _apiKeys.SpotifyClientId),
                    new KeyValuePair<string, string>("code_verifier", codeVerifier)
                }));

            if (!result.IsSuccessStatusCode)
            {
                var errorContent = await result.Content.ReadAsStringAsync();
                throw new Exception($"Failed to exchange code for token: {result.ReasonPhrase}. Details: {errorContent}");
            }

            var content = await result.Content.ReadAsStringAsync();
            var tokenResult = JsonSerializer.Deserialize<SpotifyAccessTokenResult>(content);

            return tokenResult;
        }

        public async Task<object> CreatePlaylist(string accessToken, string name, string description, bool isPublic, List<string> trackUris)
        {
            // Create a temporary HttpClient with the user's access token
            using var httpClient = new HttpClient();
            httpClient.BaseAddress = new Uri("https://api.spotify.com/v1/");
            httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

            // Create playlist
            var createPlaylistBody = new
            {
                name = name,
                description = description,
                @public = isPublic
            };

            var createResponse = await httpClient.PostAsync(
                $"me/playlists",
                new StringContent(JsonSerializer.Serialize(createPlaylistBody), System.Text.Encoding.UTF8, "application/json"));

            if (!createResponse.IsSuccessStatusCode)
            {
                var errorContent = await createResponse.Content.ReadAsStringAsync();
                throw new Exception($"Failed to create playlist: {createResponse.ReasonPhrase}. Details: {errorContent}");
            }

            var playlistContent = await createResponse.Content.ReadAsStringAsync();
            var playlistJson = JsonSerializer.Deserialize<JsonElement>(playlistContent);
            var playlistId = playlistJson.GetProperty("id").GetString();
            var playlistUrl = playlistJson.GetProperty("external_urls").GetProperty("spotify").GetString();

            // Add tracks to playlist (filter out failed tracks)
            var validTrackUris = trackUris.Where(uri => uri != "fail").ToList();
            if (validTrackUris.Any())
            {
                var addTracksBody = new { uris = validTrackUris };
                var addTracksResponse = await httpClient.PostAsync(
                    $"playlists/{playlistId}/items",
                    new StringContent(JsonSerializer.Serialize(addTracksBody), System.Text.Encoding.UTF8, "application/json"));

                if (!addTracksResponse.IsSuccessStatusCode)
                {
                    var errorContent = await addTracksResponse.Content.ReadAsStringAsync();
                    throw new Exception($"Failed to add tracks to playlist: {addTracksResponse.ReasonPhrase}. Details: {errorContent}");
                }
            }

            // TODO Save as recent setlist

            return new
            {
                id = playlistId,
                url = playlistUrl,
                name = name,
                trackCount = validTrackUris.Count
            };
        }
    }
}
