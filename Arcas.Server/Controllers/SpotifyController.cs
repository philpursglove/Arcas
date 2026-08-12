using Arcas.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace Arcas.Server.Controllers;

[ApiController]
[Route("[controller]")]

public class SpotifyController : ControllerBase
{
    private readonly SpotifyService _spotifyService;

    public SpotifyController(SpotifyService spotifyService)
    {
        _spotifyService = spotifyService;
    }


    [HttpGet("searchtrack")]
    public async Task<DTO.Outbound.SpotifyTrack> SearchTrack(string artistName, string trackName)
    {
        return await _spotifyService.SearchTrack(artistName, trackName);
    }

    [HttpGet("getclientid")]
    public string GetClientId()
    {
        return _spotifyService.GetClientId();
    }
}