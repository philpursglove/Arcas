using System.Text.Json.Serialization;

namespace Arcas.Server.DTO.Inbound
{
    public class SpotifyAccessTokenResult
    {
        [JsonPropertyName("access_token")]
        public string Token { get; set; }

        [JsonPropertyName("token_type")]
        public string Type { get; set; }

        [JsonPropertyName("expires_in")]
        public int ExpirySeconds { get; set; }
    }
}