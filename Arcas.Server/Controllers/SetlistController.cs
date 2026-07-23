using Arcas.Server.DTO.Inbound;
using Arcas.Server.DTO.Outbound;
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
            var setlistApiUrl = $"search/artists?artistName={Uri.EscapeDataString(searchText)}&sort=relevance";
            var response = await _httpClient.GetAsync(setlistApiUrl);
            if (!response.IsSuccessStatusCode)
            {
                return new StatusCodeResult((int)response.StatusCode);
            }
            var content = await response.Content.ReadAsStringAsync();
            var artistSearchResult = JsonSerializer.Deserialize<SetlistArtistSearchResult>(content);

            if (artistSearchResult.Artists.Any(a => a.Name.ToLowerInvariant() == searchText.ToLowerInvariant()))
            {
                // search for setlists using the id
                var artist = artistSearchResult.Artists.First(a => a.Name.ToLowerInvariant() == searchText.ToLowerInvariant());

                var setlistsApiUrl = $"search/setlists?artistMbid={Uri.EscapeDataString(artist.Id)}";
                response = await _httpClient.GetAsync(setlistsApiUrl);
                if (!response.IsSuccessStatusCode)
                {
                    return new StatusCodeResult((int)response.StatusCode);
                }
                var setlistsContent = await response.Content.ReadAsStringAsync();
                var setlistsResult = JsonSerializer.Deserialize<SetlistSearchResult>(setlistsContent);

                var setlists = setlistsResult.Setlists.Select(s => new DTO.Outbound.Setlist()
                {
                    Id = s.Id,
                    eventDate = DateOnly.FromDateTime(DateTime.Parse(s.EventDate)),
                    Venue = new DTO.Outbound.Venue() { Name = s.Venue?.Name, City = s.Venue?.City?.Name, Country = s.Venue?.City?.Country?.Name },
                    Artist = new Artist() { Name = artist.Name, Id = artist.Id },
                    Tour = s.Tour?.Name,
                    Songs = s.Sets?.Setslist?.SelectMany(set => set.Songs?.Select(song => new DTO.Outbound.Song() { Name = song.Name }) ?? new List<DTO.Outbound.Song>()).Where(s => !string.IsNullOrWhiteSpace(s.Name)).ToList() ?? new List<DTO.Outbound.Song>(),
                    formattedDate = DateTime.Parse(s.EventDate).ToString("d MMM yyyy"),
                    url = s.SetlistUri.ToString()
                }).ToList();

                setlists = setlists.Where(s => s.eventDate <= DateOnly.FromDateTime(DateTime.Today)
                                               && s.Songs.Any()).ToList();

                return new OkObjectResult(setlists);
            }
            else
            {
                return new NotFoundObjectResult($"No artist found with the name '{searchText}'.");
            }
        }

        [HttpGet("getsetlistfromurl")]
        public async Task<IActionResult> GetSetlistFromUrl(string setlistUrl)
        {
            if (string.IsNullOrWhiteSpace(setlistUrl))
            {
                return new BadRequestObjectResult("Setlist URL cannot be empty.");
            }

            var setlistId = setlistUrl.ToLower().Substring(setlistUrl.LastIndexOf('-') + 1).TrimEnd(".html").ToString();

            return await GetSetlist(setlistId);
        }

        [HttpGet("getsetlist")]
        public async Task<IActionResult> GetSetlist(string setlistId)
        {
            if (string.IsNullOrWhiteSpace(setlistId))
            {
                return new BadRequestObjectResult("Setlist ID cannot be empty.");
            }
            var setlistApiUrl = $"setlist/{Uri.EscapeDataString(setlistId)}";
            var response = await _httpClient.GetAsync(setlistApiUrl);
            if (!response.IsSuccessStatusCode)
            {
                return new StatusCodeResult((int)response.StatusCode);
            }
            var content = await response.Content.ReadAsStringAsync();
            var setlist = JsonSerializer.Deserialize<DTO.Inbound.Setlist>(content);
            var artist = new Artist() { Name = setlist.Artist.Name, Id = setlist.Artist.Id };
            var outboundSetlist = new DTO.Outbound.Setlist()
            {
                Id = setlist.Id,
                eventDate = DateOnly.FromDateTime(DateTime.Parse(setlist.EventDate)),
                Venue = new DTO.Outbound.Venue() { Name = setlist.Venue?.Name, City = setlist.Venue?.City?.Name, Country = setlist.Venue?.City?.Country?.Name },
                Artist = artist,
                Tour = setlist.Tour?.Name,
                Songs = setlist.Sets?.Setslist?.SelectMany(set => set.Songs?.Select(song => new DTO.Outbound.Song() { Name = song.Name }) ?? new List<DTO.Outbound.Song>()).ToList() ?? new List<DTO.Outbound.Song>(),
                formattedDate = DateTime.Parse(setlist.EventDate).ToString("d MMM yyyy")
            };
            return new OkObjectResult(outboundSetlist);
        }


    }
}