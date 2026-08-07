using Arcas.Server.Services;
using Microsoft.AspNetCore.Mvc;

namespace Arcas.Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class SetlistController : ControllerBase
    {
        private readonly SetlistService _service;

        public SetlistController(SetlistService service)
        {
            _service = service;
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