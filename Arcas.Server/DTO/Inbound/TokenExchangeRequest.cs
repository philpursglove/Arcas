namespace Arcas.Server.DTO.Inbound;

public class TokenExchangeRequest
{
    public string Code { get; set; }
    public string CodeVerifier { get; set; }
    public string RedirectUri { get; set; }
}
