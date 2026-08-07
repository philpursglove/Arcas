using Arcas.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

namespace Arcas.Server.Controllers;

[ApiController]
[Route("[controller]")]

public class SpotifyController : ControllerBase
{
    private readonly ApiKeys _apiKeys;
    private readonly HttpClient _httpClient;
    private IMemoryCache _cache;

    private const string SpotifyBearerTokenCacheKey = "SpotifyBearerToken";

    private readonly SpotifyService _spotifyService;

    public SpotifyController
        (IOptions<ApiKeys> options, HttpClient httpClient, IMemoryCache memoryCache, SpotifyService spotifyService)
    {
        _apiKeys = options.Value;
        _httpClient = httpClient;
        _spotifyService = spotifyService;

        _httpClient.BaseAddress = new Uri("https://api.spotify.com/v1/");
        _httpClient.Timeout = TimeSpan.FromSeconds(30);

        _cache = memoryCache;
    }


    [HttpGet("searchtrack")]
    public async Task<DTO.Outbound.SpotifyTrack> SearchTrack(string artistName, string trackName)
    {
        return await _spotifyService.SearchTrack(artistName, trackName);
    }
}