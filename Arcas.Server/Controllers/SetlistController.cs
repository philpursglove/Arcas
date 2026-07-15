using Microsoft.Extensions.Options;

namespace Arcas.Server.Controllers
{
    public class SetlistController
    {
        private readonly ApiKeys _apiKeys;

        public SetlistController(IOptions<ApiKeys> options)
        {
            _apiKeys = options.Value;
        }
    }
}