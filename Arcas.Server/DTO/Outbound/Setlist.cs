namespace Arcas.Server.DTO.Outbound
{
    public class Setlist
    {
        public string Id { get; set; }
        public DateOnly eventDate { get; set; }

        public List<Song> Songs { get; set; }

        public Artist Artist { get; set; }

        public string? Tour { get; set; }

        public Venue Venue { get; set; }

        public string formattedDate { get; set; }

        public string url { get; set; }
    }

    public class Song
    {
        public string Name { get; set; }

        public bool Cover { get; set; }

        public Artist? CoverArtist { get; set; }
    }

    public class Artist
    {
        public string Name { get; set; }
        public string Id { get; set; }
    }

    public class Venue
    {
        public string Name { get; set; }
        public string City { get; set; }
        public string Country { get; set; }
    }
}
