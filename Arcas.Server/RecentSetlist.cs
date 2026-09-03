using Azure;
using Azure.Data.Tables;

namespace Arcas.Server
{
    public class RecentSetlist : ITableEntity
    {
        public string PartitionKey { get; set; } = "RecentSetlist";
        public string RowKey { get; set; } = Guid.NewGuid().ToString();
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }
        public string Id { get; set; }
        public string Artist { get; set; }
        public string Name { get; set; }
        public string SetlistId { get; set; }
        public DateTime EventDate { get; set; }
    }
}
