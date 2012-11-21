using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Net;

using Bing;

namespace k2e
{
    public class BingData
    {
        private const string USER_ID = "devy69@hotmail.com";
        private const string SECURE_ACCOUNT_ID = 
                "BxY8uoep05kesB9rSof2lKeKj9w2wWzH+86qhBHx1nc=";
        private const string ROOT_SERVICE_URL = 
                "https://api.datamarket.azure.com/Bing/SearchWeb/v1/";
        private BingSearchContainer context;

        public BingData()
        {
            context = new BingSearchContainer(new Uri(ROOT_SERVICE_URL));
            context.IgnoreMissingProperties = true;
            context.Credentials = new NetworkCredential(
                    USER_ID,
                    SECURE_ACCOUNT_ID);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="Query">Bing search query Sample Values : xbox</param>
        /// <param name="Market">Market. Note: Not all Sources support all markets. Sample Values : en-US</param>
        /// <param name="Adult">Adult setting is used for filtering sexually explicit content Sample Values : Moderate</param>
        /// <param name="Latitude">Latitude Sample Values : 47.603450</param>
        /// <param name="Longitude">Longitude Sample Values : -122.329696</param>
        /// <param name="WebFileType">File extensions to return Sample Values : XLS</param>
        /// <param name="Options">Specifies options for this request for all Sources. Valid values are: DisableLocationDetection, EnableHighlighting. Sample Values : EnableHighlighting</param>
        /// <param name="WebSearchOptions">Specify options for a request to the Web SourceType. Valid values are: DisableHostCollapsing, DisableQueryAlterations. Sample Values : DisableQueryAlterations</param>
        /// <returns></returns>
        public IList<WebResult> GetBingData(
                string Query, 
                string Market = null,
                string Adult = null,
                Double? Latitude = null,
                Double? Longitude = null,
                String WebFileType = null,
                String Options = null,
                String WebSearchOptions = null)
        {
            IEnumerable<WebResult> query;

            query = context.Web(
                    Query, Market, Adult, Latitude, Longitude,
                    WebFileType, Options, WebSearchOptions);

            try
            {
                return query.ToList();
            }
            catch (Exception)
            {
                return null;
            }
        }


    }
}