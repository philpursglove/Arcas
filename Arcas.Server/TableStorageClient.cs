using Azure.Data.Tables;
using System.Linq.Expressions;

namespace Arcas.Server
{
    public class TableStorageClient<T> where T : class, ITableEntity
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

        public async Task Delete(T entity)
        {
            await tableClient.DeleteEntityAsync(entity.PartitionKey, entity.RowKey);
        }

        public async Task<List<T>> Query(Expression<Func<T, bool>> filter, int pageSize)
        {
            var pageable = tableClient.QueryAsync<T>(filter, maxPerPage: pageSize);
            return await pageable.ToListAsync();
        }
    }
}
