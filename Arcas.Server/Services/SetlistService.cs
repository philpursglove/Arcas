using Arcas.Server.DTO.Inbound;
using Arcas.Server.DTO.Outbound;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace Arcas.Server.Services
{
    public class SetlistService
    {
        private readonly ApiKeys _apiKeys;
        private readonly HttpClient _httpClient;

        public SetlistService(IOptions<ApiKeys> options, HttpClient httpClient)
        {
            _apiKeys = options.Value;
            _httpClient = httpClient;

            _httpClient.BaseAddress = new Uri("https://api.setlist.fm/rest/1.0/");
            _httpClient.DefaultRequestHeaders.Add("x-api-key", _apiKeys.SetlistFmApiKey);
            _httpClient.DefaultRequestHeaders.Add("Accept", "application/json");
        }

        public async Task<DTO.Outbound.Setlist?> GetSetlist(string setlistId)
        {
            var setlistUrl = $"setlist/{setlistId}";
            var response = await _httpClient.GetAsync(setlistUrl);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            var setlistResult = JsonSerializer.Deserialize<DTO.Inbound.Setlist>(content);

            var setlist = new DTO.Outbound.Setlist();
            setlist.Id = setlistResult.Id;
            setlist.eventDate = DateOnly.FromDateTime(DateTime.Parse(setlistResult.EventDate));
            setlist.Venue = new DTO.Outbound.Venue()
            {
                Name = setlistResult.Venue?.Name,
                City = setlistResult.Venue?.City?.Name,
                Country = setlistResult.Venue?.City?.Country?.Name
            };
            setlist.Artist = new Artist() { Name = setlistResult.Artist?.Name, Id = setlistResult.Artist?.Id };
            setlist.Tour = setlistResult.Tour?.Name;
            setlist.Songs = setlistResult.Sets?.Setslist?.SelectMany(set => set.Songs?.Where(s => !s.Tape)
                                .Select(song => new DTO.Outbound.Song()
                                {
                                    Name = song.Name,
                                    Cover = song.Cover,
                                    CoverArtist = song.CoverArtist != null
                                        ? new DTO.Outbound.Artist()
                                        { Name = song.CoverArtist.Name, Id = song.CoverArtist.Id }
                                        : null
                                }) ?? new List<DTO.Outbound.Song>()).Where(s => !string.IsNullOrWhiteSpace(s.Name))
                            .ToList() ??
                            new List<DTO.Outbound.Song>();
            setlist.formattedDate = DateTime.Parse(setlistResult.EventDate).ToString("d MMM yyyy");
            setlist.url = setlistResult.SetlistUri.ToString();

            return setlist;
        }

        public async Task<List<DTO.Outbound.Setlist>?> GetArtistSetlistsPage(string artistId, int pageNumber)
        {
            var setlistsApiUrl = $"search/setlists?artistMbid={Uri.EscapeDataString(artistId)}&p={pageNumber}";
            var response = await _httpClient.GetAsync(setlistsApiUrl);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var setlistsContent = await response.Content.ReadAsStringAsync();
            var setlistsResult = JsonSerializer.Deserialize<SetlistSearchResult>(setlistsContent);
            var setlists = setlistsResult.Setlists.Select(s => new DTO.Outbound.Setlist()
            {
                Id = s.Id,
                eventDate = DateOnly.FromDateTime(DateTime.Parse(s.EventDate)),
                Venue = new DTO.Outbound.Venue()
                { Name = s.Venue?.Name, City = s.Venue?.City?.Name, Country = s.Venue?.City?.Country?.Name },
                Artist = new Artist() { Name = s.Artist?.Name, Id = s.Artist?.Id },
                Tour = s.Tour?.Name,
                Songs = s.Sets?.Setslist?.SelectMany(set => set.Songs?.Where(s => !s.Tape)
                            .Select(song => new DTO.Outbound.Song()
                            {
                                Name = song.Name,
                                Cover = song.Cover,
                                CoverArtist = song.CoverArtist != null
                                    ? new DTO.Outbound.Artist() { Name = song.CoverArtist.Name, Id = song.CoverArtist.Id }
                                    : null
                            }) ?? new List<DTO.Outbound.Song>()).Where(s => !string.IsNullOrWhiteSpace(s.Name))
                        .ToList() ??
                        new List<DTO.Outbound.Song>(),
                formattedDate = DateTime.Parse(s.EventDate).ToString("d MMM yyyy"),
                url = s.SetlistUri.ToString()
            }).ToList();
            setlists = setlists.Where(s => s.eventDate <= DateOnly.FromDateTime(DateTime.Today)
                                           && s.Songs.Any()).ToList();

            return setlists;
        }

        public async Task<List<DTO.Outbound.Setlist>?> ArtistSearch(string searchText)
        {
            var setlistApiUrl = $"search/artists?artistName={Uri.EscapeDataString(searchText)}&sort=relevance";
            var response = await _httpClient.GetAsync(setlistApiUrl);
            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var content = await response.Content.ReadAsStringAsync();
            var artistSearchResult = JsonSerializer.Deserialize<SetlistArtistSearchResult>(content);

            if (artistSearchResult.Artists.Any(a => a.Name.ToLowerInvariant() == searchText.ToLowerInvariant()))
            {
                // search for setlists using the id
                var artist =
                    artistSearchResult.Artists.First(a => a.Name.ToLowerInvariant() == searchText.ToLowerInvariant());

                return await GetArtistSetlistsPage(artist.Id, 1);
            }

            return null;
        }
    }
}