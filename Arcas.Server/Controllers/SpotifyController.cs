using Microsoft.Extensions.Options;

namespace Arcas.Server.Controllers;

public class SpotifyController
{
    private readonly ApiKeys _apiKeys;

    public SpotifyController
        (IOptions<ApiKeys> options)
    {
        _apiKeys = options.Value;
    }
}