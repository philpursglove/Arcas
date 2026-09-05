using Azure;
using Azure.Data.Tables;

namespace Arcas.Server
{
    public class TableStorageClient<T> where T : ITableEntity
    {
        private readonly TableClient tableClient;
        public TableStorageClient(string connectionString)
        {
            var serviceClient = new TableServiceClient(connectionString);
            tableClient = serviceClient.GetTableClient(typeof(T).Name);
        }

        public async Task Save(T entity)
        {
            await tableClient.AddEntityAsync(entity);
        }

        public async Task Delete(ETag etag)
        {
            await tableClient.DeleteEntityAsync(etag);
        }
    }
}
