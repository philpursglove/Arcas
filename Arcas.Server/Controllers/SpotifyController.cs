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

    [HttpPost("exchangetoken")]
    public async Task<IActionResult> ExchangeToken([FromBody] TokenExchangeRequest request)
    {
        try
        {
            var tokenResult = await _spotifyService.ExchangeCodeForToken(
                request.Code, 
                request.CodeVerifier, 
                request.RedirectUri);

            return Ok(new
            {
                access_token = tokenResult.Token,
                expires_in = tokenResult.ExpirySeconds,
                refresh_token = tokenResult.RefreshToken
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("createplaylist")]
    public async Task<IActionResult> CreatePlaylist([FromBody] CreatePlaylistRequest request)
    {
        try
        {
            var playlist = await _spotifyService.CreatePlaylist(
                request.AccessToken,
                request.Name,
                request.Description,
                request.IsPublic,
                request.TrackUris);

            return Ok(playlist);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

public class TokenExchangeRequest
{
    public string Code { get; set; }
    public string CodeVerifier { get; set; }
    public string RedirectUri { get; set; }
}

public class CreatePlaylistRequest
{
    public string AccessToken { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public bool IsPublic { get; set; }
    public List<string> TrackUris { get; set; }
}