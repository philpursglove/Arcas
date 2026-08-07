using Arcas.Server.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Arcas.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class SetlistController : ControllerBase
    {
        private readonly ApiKeys _apiKeys;
        private readonly HttpClient _httpClient;
        private readonly SetlistService _service;

        public SetlistController(IOptions<ApiKeys> options, HttpClient httpClient, SetlistService service)
        {
            _apiKeys = options.Value;
            _httpClient = httpClient;
            _service = service;

            _httpClient.BaseAddress = new Uri("https://api.setlist.fm/rest/1.0/");
            _httpClient.DefaultRequestHeaders.Add("x-api-key", _apiKeys.SetlistFmApiKey);
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        [HttpGet("artistsearch")]
        public async Task<IActionResult> ArtistSearch(string searchText)
        {
            if (string.IsNullOrWhiteSpace(searchText))
            {
                return new BadRequestObjectResult("Search text cannot be empty.");
            }

            var setlists = await _service.ArtistSearch(searchText);
            if (setlists != null && setlists.Any())
            {
                return new OkObjectResult(setlists);
            }

            return new NotFoundObjectResult($"No artist found with the name '{searchText}'.");
        }

        [HttpGet("getsetlist")]
        public async Task<IActionResult> GetSetlist(string setlistId)
        {
            if (string.IsNullOrWhiteSpace(setlistId))
            {
                return new BadRequestObjectResult("Setlist ID cannot be empty.");
            }

            var setlist = await _service.GetSetlist(setlistId);
            if (setlist == null)
            {
                return new NotFoundObjectResult($"No setlist found with the ID '{setlistId}'.");
            }

            return Ok(setlist);
        }

        [HttpGet("getartistsetlistpage")]
        public async Task<IActionResult> GetArtistSetlistPage(string artistId, int pageNumber)
        {
            if (string.IsNullOrWhiteSpace(artistId))
            {
                return new BadRequestObjectResult("Artist ID cannot be empty.");
            }

            var setlists = await _service.GetArtistSetlistsPage(artistId, pageNumber);

            return new OkObjectResult(setlists);
        }

    }
}