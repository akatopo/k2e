using System;
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
			new string[] { "k2e", "kindle_clippings" };

        [WebMethod]
        public static string Export(DocumentArrayExport q)
        {
			try
			{
				if (HttpContext.Current.Request.Cookies["ConsumerPublicKey"] == null)
				{
					throw new Exception("ConsumerPublicKey not in cookie");
				}

				var eah = EvernoteAuthHelper.LoadCredentials(
					"",
					HttpContext.Current.Request.Cookies.TryGetValue("ConsumerPublicKey"),
					HttpContext.Current.Request.Cookies.TryGetValue("K2eAccessToken")
				);
				var accessTokenContainer = eah.GetAccessToken();

	            var exporter = new EvernoteExporter(
	                accessTokenContainer: accessTokenContainer,
	                clippingNotebookName: CLIPPING_NOTEBOOK_NAME,
	                defaultTags: DEFAULT_TAGS);

	            exporter.ExportClippings(q);
			}
			catch (System.Net.WebException ex)
			{
				
			}

            return ":-D";

        }

    }
}