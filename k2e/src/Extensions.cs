using System;
using System.Net;
using System.Web;

namespace k2e
{
    public static class Extensions
    {
        public static string HtmlEncode(this string s)
        {
            return WebUtility.HtmlEncode(s);
        }

		public static string TryGetValue(this HttpCookieCollection c, string key)
		{
			return c[key] == null ? "" : c[key].Value;
		}
    }
}