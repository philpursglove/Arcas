namespace Arcas.Server
{
    public class ArtistDTO
    {
        public string Id { get; set; }
        public string Name { get; set; }
    }

    public class ArtistSearchResultDTO
    {
        public List<ArtistDTO> Artists { get; set; }
    }
}
