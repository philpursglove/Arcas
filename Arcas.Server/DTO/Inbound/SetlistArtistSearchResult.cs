using Arcas.Server.DTO.Outbound;
using System.Text.Json.Serialization;

namespace Arcas.Server.DTO.Inbound
{
    internal class SetlistArtistSearchResult
    {
        [JsonPropertyName("artist")]
        public List<SetlistArtist> Artists { get; set; }
    }

    internal class SetlistArtist
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("mbid")]
        public string Id { get; set; }
    }

    internal class SetlistSearchResult
    {
        [JsonPropertyName("setlist")]
        public List<Setlist> Setlists { get; set; }
    }

    internal class Setlist
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("eventDate")]
        public string EventDate { get; set; }

        [JsonPropertyName("venue")]
        public Venue Venue { get; set; }

        [JsonPropertyName("url")]
        public Uri SetlistUri { get; set; }

        [JsonPropertyName("sets")]
        public Sets Sets { get; set; }

        [JsonPropertyName("tour")]
        public Tour? Tour { get; set; }

        [JsonPropertyName("artist")]
        public SetlistArtist Artist { get; set; }
    }

    internal class Tour
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }
    }

    internal class Sets
    {
        [JsonPropertyName("set")]
        public List<Set> Setslist { get; set; }
    }

    internal class Set
    {
        [JsonPropertyName("song")]
        public List<Song> Songs { get; set; }
    }

    internal class Song
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("cover")]
        public Artist? CoverArtist { get; set; }

        public bool Cover => CoverArtist != null;
    }

    internal class Venue
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("city")]
        public City City { get; set; }
    }

    internal class City
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("country")]
        public Country Country { get; set; }
    }

    internal class Country
    {
        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("code")]
        public string Code { get; set; }
    }
}
