using System.Text.Json.Serialization;

namespace Arcas.Server.DTO.Inbound;

public class SpotifyTrackSearchResult
{
    [JsonPropertyName("tracks")]
    public SpotifyTrackSearchTracks Tracks { get; set; }
}

public class SpotifyTrackSearchTracks
{
    [JsonPropertyName("items")]
    public SpotifyTrack[] Items { get; set; }
}

public class SpotifyTrack
{
    [JsonPropertyName("uri")]
    public string SpotifyUri { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; }

    [JsonPropertyName("artists")]
    public SpotifyArtist[] Artists { get; set; }

    [JsonPropertyName("is_playable")]
    public bool Playable { get; set; }

    [JsonPropertyName("is_local")]
    public bool Local { get; set; }
}

public class SpotifyArtist
{
    [JsonPropertyName("id")]
    public string Id { get; set; }

    [JsonPropertyName("name")]
    public string Name { get; set; }
}
