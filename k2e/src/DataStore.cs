using System;
using System.Collections.Generic;
using System.Configuration;
using System.Threading.Tasks;

using MongoDB.Bson;
using MongoDB.Driver;

using EvernoteWebQuickstart;

namespace k2e
{
	public static class DataStore
	{
		private static IMongoClient client;

		private static IMongoDatabase database;

		private const string EVERNOTE_CREDENTIALS_COLLECTION = "evernotecredentials";

		private static readonly string MONGO_CONNECTION_STRING =
			string.IsNullOrEmpty(ConfigurationManager.AppSettings[ConfigurationManager.AppSettings["DeploymentMongoConnectionKey"]]) ?
				ConfigurationManager.AppSettings["MongoConnectionString"] :
				ConfigurationManager.AppSettings[ConfigurationManager.AppSettings["DeploymentMongoConnectionKey"]];

		static DataStore()
		{
			var mongoUrl = MongoUrl.Create(MONGO_CONNECTION_STRING);
			client = new MongoClient(mongoUrl);
			database = client.GetDatabase(mongoUrl.DatabaseName);
		}

		public static Task<ReplaceOneResult> InsertOrReplaceCredentials(EvernoteCredentials credentials)
		{
			
			var collection = database.GetCollection<BsonDocument>(EVERNOTE_CREDENTIALS_COLLECTION);
			var builder = Builders<BsonDocument>.Filter;
			var filter = builder.Eq("ConsumerPublicKey", credentials.ConsumerPublicKey) &
				builder.Eq("K2eAccessToken", credentials.K2eAccessToken);
			var document = credentials.ToBsonDocument();

			return collection.ReplaceOneAsync(
				filter,
				document,
				new UpdateOptions { IsUpsert = true }
			);
		}

		public static Task<UpdateResult> UpdateK2eAccessToken(EvernoteCredentials credentials,  string oldAccessToken)
		{
			var collection = database.GetCollection<BsonDocument>(EVERNOTE_CREDENTIALS_COLLECTION);
			var builder = Builders<BsonDocument>.Filter;
			var filter = builder.Eq("ConsumerPublicKey", credentials.ConsumerPublicKey) &
				builder.Eq("K2eAccessToken", oldAccessToken);

			return collection.UpdateOneAsync(
				filter,
				Builders<BsonDocument>.Update.Set("K2eAccessToken", credentials.K2eAccessToken)
			);
		}

		public static Task<List<BsonDocument>> FindCredentials(string consumerPublicKey, string k2eAccessToken)
		{
			var collection = database.GetCollection<BsonDocument>(EVERNOTE_CREDENTIALS_COLLECTION);
			var builder = Builders<BsonDocument>.Filter;
			var filter = builder.Eq("ConsumerPublicKey", consumerPublicKey) &
				builder.Eq("K2eAccessToken", k2eAccessToken);

			return collection.Find(filter).ToListAsync();
		}

		public static Task<DeleteResult> RemoveCredentials(string consumerPublicKey, string k2eAccessToken)
		{
			var collection = database.GetCollection<BsonDocument>(EVERNOTE_CREDENTIALS_COLLECTION);
			var builder = Builders<BsonDocument>.Filter;
			var filter = builder.Eq("ConsumerPublicKey", consumerPublicKey) &
				builder.Eq("K2eAccessToken", k2eAccessToken);

			return collection.DeleteOneAsync(filter);
		}

	}
}

