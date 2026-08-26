namespace Arcas.Server.DTO.Inbound;

public class CreatePlaylistRequest
{
    public string AccessToken { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public bool IsPublic { get; set; }
    public List<string> TrackUris { get; set; }
}