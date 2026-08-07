using Arcas.Server;
using Arcas.Server.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
//builder.Services.AddApplicationInsightsTelemetry();

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddHttpClient();

builder.Services.AddMemoryCache();

builder.Services.Configure<ApiKeys>(builder.Configuration.GetSection("ApiKeys"));

builder.Services.AddScoped<SetlistService>();
builder.Services.AddScoped<SpotifyService>();

var app = builder.Build();

app.UseDefaultFiles();
app.MapStaticAssets();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.MapFallbackToFile("/index.html");

app.Run();
