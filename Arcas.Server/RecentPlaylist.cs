using Azure;
using Azure.Data.Tables;

namespace Arcas.Server
{
    public class RecentPlaylist : ITableEntity
    {
        public string PartitionKey { get; set; } = "RecentPlaylist";
        public string RowKey { get; set; } = Guid.NewGuid().ToString();
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }
        public string Id { get; set; }
        public string Name { get; set; }
        public string Url { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}