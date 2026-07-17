using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace Arcas.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class SetlistController : ControllerBase
    {
        private readonly ApiKeys _apiKeys;
        private readonly HttpClient _httpClient;

        public SetlistController(IOptions<ApiKeys> options, HttpClient httpClient)
        {
            _apiKeys = options.Value;
            _httpClient = httpClient;

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
            var setlistApiUrl = $"search/artists?artistName={Uri.EscapeDataString(searchText)}";
            var response = await _httpClient.GetAsync(setlistApiUrl);
            if (!response.IsSuccessStatusCode)
            {
                return new StatusCodeResult((int)response.StatusCode);
            }
            var content = await response.Content.ReadAsStringAsync();
            var artistSearchResult = JsonSerializer.Deserialize<ArtistSearchResultDTO>(content);
            return new OkObjectResult(artistSearchResult);
        }

        [HttpGet("setlistlookup")]
        public async Task<IActionResult> SetlistLookup(string setlistUrl)
        {
            if (string.IsNullOrWhiteSpace(setlistUrl))
            {
                return new BadRequestObjectResult("Setlist URL cannot be empty.");
            }

            var setlistId = setlistUrl.ToLower().Substring(setlistUrl.LastIndexOf('/') + 1).TrimEnd(".html");

        }


    }
}