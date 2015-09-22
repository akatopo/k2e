using System;
using System.Collections.Generic;
using System.Net;
using System.Web;
using System.Web.Services;
using System.Web.UI;

using EvernoteWebQuickstart;

namespace k2e
{
	public partial class Default : System.Web.UI.Page
    {
        protected const string CLIPPING_NOTEBOOK_NAME = "Kindle Clippings";

        protected readonly static string[] DEFAULT_TAGS =
			new string[] { "k2e" };

		private static EvernoteAuthHelper GetAuthHelper(string consumerPublicKey, string k2eAccessToken)
		{
			if (string.IsNullOrEmpty(consumerPublicKey) || string.IsNullOrEmpty(k2eAccessToken))
			{
				throw new ApiException()
				{
					Code = ErrorCode.INVALID_CREDENTIALS,
					Message = "Invalid credentials provided",
					HttpStatusCode = HttpStatusCode.Unauthorized
				};
			}
			var eah = EvernoteAuthHelper.LoadCredentials(
				"",
				consumerPublicKey,
				k2eAccessToken
			);
			return eah;
		}

		private static Dictionary<string, object> CreateApiReply(Action a)
		{
			var errors = new List<object>();

			try
			{
				a();
			}
			catch (ApiException ex)
			{
				errors.Add(new Dictionary<string, object>() { { "code", ex.Code }, { "message", ex.Message} });
				HttpContext.Current.Response.StatusCode = (int)ex.HttpStatusCode;
			}
			catch (Exception)
			{
				errors.Add(new Dictionary<string, object>() { { "code", ErrorCode.UNKNOWN }, { "message", "Unknown error occured"} });
				HttpContext.Current.Response.StatusCode = (int)HttpStatusCode.BadRequest;
			}

			if (errors.Count == 0)
			{
				return new Dictionary<string, object>();
			}
			return new Dictionary<string, object>() { { "errors", errors } };
		}

        [WebMethod]
		public static Dictionary<string, object> Export(DocumentArrayExport q)
        {
			var consumerPublicKey = HttpContext.Current.Request.Cookies.TryGetValue("ConsumerPublicKey");
			var k2eAccessToken = HttpContext.Current.Request.Cookies.TryGetValue("K2eAccessToken");

			return CreateApiReply(() =>
				{
					var accessTokenContainer = GetAuthHelper(consumerPublicKey, k2eAccessToken)
						.GetAccessToken();
					var exporter = new EvernoteExporter(
						accessTokenContainer: accessTokenContainer,
						clippingNotebookName: CLIPPING_NOTEBOOK_NAME,
						defaultTags: DEFAULT_TAGS);

					exporter.ExportClippings(q);
				}
			);

        }

		[WebMethod]
		public static Dictionary<string, object> Revoke()
		{
			var consumerPublicKey = HttpContext.Current.Request.Cookies.TryGetValue("ConsumerPublicKey");
			var k2eAccessToken = HttpContext.Current.Request.Cookies.TryGetValue("K2eAccessToken");

			return CreateApiReply(() =>
				{
					var authHelper = GetAuthHelper(consumerPublicKey, k2eAccessToken);
					authHelper.RevokeSession();
				}
			);

		}

    }
}