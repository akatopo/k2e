using System;
using System.Net;

namespace k2e
{
    public static class Extensions
    {
        public static string HtmlEncode(this string s)
        {
            return WebUtility.HtmlEncode(s);
        }
    }
}