using System;
using System.Net;
using System.IO;

namespace k2e
{
    static public class FaviconFetcher
    {
        const string PROVIDER = "http://www.fvicon.com/";

        const string PARAMETERS = "?width=16&height=16&format=png";

        static public byte[] GetBytes(Uri hostUrl, out string mimeType)
        {
            byte[] imgBytes = null;

            HttpWebRequest request =
                    (HttpWebRequest)WebRequest.Create(
                            PROVIDER +
                            hostUrl.Host.HtmlEncode() +
                            PARAMETERS);

            HttpWebResponse response = (HttpWebResponse)request.GetResponse();
            if (response.StatusCode == HttpStatusCode.OK &&
                    response.ContentLength > 0)
            {
                Stream s = response.GetResponseStream();
                int len = (int)response.ContentLength;
                BinaryReader br = new BinaryReader(s);

                imgBytes = br.ReadBytes(len);
            }

            mimeType = response.ContentType;
            return imgBytes;
        }
    }
}