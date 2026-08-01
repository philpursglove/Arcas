using Arcas.Server.DTO.Inbound;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace Arcas.Server.Controllers;

public class SpotifyController : Controller
{
    private readonly ApiKeys _apiKeys;
    private readonly HttpClient _httpClient;
    private IMemoryCache _cache;

    private const string SpotifyBearerTokenCacheKey = "SpotifyBearerToken";

    public SpotifyController
        (IOptions<ApiKeys> options, HttpClient httpClient, IMemoryCache memoryCache)
    {
        _apiKeys = options.Value;
        _httpClient = httpClient;

        _httpClient.BaseAddress = new Uri("https://api.spotify.com/v1/");
        _httpClient.Timeout = TimeSpan.FromSeconds(30);

        _cache = memoryCache;
    }

    private async Task<string> GetSpotifyBearerToken()
    {
        if (_cache.TryGetValue(SpotifyBearerTokenCacheKey, out object? cachedValue))
        {
            return (string)cachedValue;
        }

        var httpClient = new HttpClient();
        httpClient.DefaultRequestHeaders.Add("Content-Type", "application/x-www-form-urlencoded");

        var result = await httpClient.PostAsync("https://accounts.spotify.com/api/token", new FormUrlEncodedContent(new[]
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

    [HttpGet("searchtrack")]
    public async Task<DTO.Outbound.SpotifyTrack> SearchTrack(string artistName, string trackName)
    {
        var token = await GetSpotifyBearerToken();
        _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
        var response = await _httpClient.GetAsync($"search?q=artist:{Uri.EscapeDataString(artistName)}&track:{Uri.EscapeDataString(trackName)}&type=track");
        if (!response.IsSuccessStatusCode)
        {
            throw new Exception($"Failed to search tracks: {response.ReasonPhrase}");
        }
        var content = await response.Content.ReadAsStringAsync();
        var searchResult = JsonSerializer.Deserialize<SpotifyTrackSearchResult>(content);
        if (searchResult.Tracks.Items.Any())
        {
            return searchResult.Tracks.Items.Select(t => new DTO.Outbound.SpotifyTrack
            {
                Id = t.Id,
                Name = t.Name
            }).FirstOrDefault();
        }
        else
        {
            return new DTO.Outbound.SpotifyTrack
            {
                Id = "fail",
                Name = trackName
            };
        }
    }
}