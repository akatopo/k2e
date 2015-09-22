using System;
using System.Net;

namespace k2e
{
	[Serializable]
	public class ApiException : Exception
	{
		public ErrorCode Code { get; set; }
		public new string Message { get; set; }
		private HttpStatusCode _httpStatusCode = HttpStatusCode.BadRequest;
		public HttpStatusCode HttpStatusCode
		{ 
			get { return _httpStatusCode; }
			set { _httpStatusCode = value; }
		}

		public override string ToString ()
		{
			return string.Format("[ApiException: Code={0}, Message={1}]", Code, Message);
		}
	}
}

