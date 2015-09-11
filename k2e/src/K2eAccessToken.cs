using System;
using System.Text;
using System.Security.Cryptography;

namespace k2e
{
	public static class K2eAccessToken
	{
		private static int LENGTH = 20;

		public static string Generate()
		{
			using (var rngCsp = new RNGCryptoServiceProvider())
			{
				var bytes = new byte[LENGTH];
				var sb = new StringBuilder();
				rngCsp.GetBytes(bytes);
				foreach (var b in bytes)
				{
					sb.AppendFormat("{0,2:x2}", b);
				}

				return sb.ToString();
			}
		}
	}
}

