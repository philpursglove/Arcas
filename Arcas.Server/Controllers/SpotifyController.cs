using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace Arcas.Server.Controllers;

public class SpotifyController : Controller
{
    private readonly ApiKeys _apiKeys;

    public SpotifyController
        (IOptions<ApiKeys> options)
    {
        _apiKeys = options.Value;
    }
}