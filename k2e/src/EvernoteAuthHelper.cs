/* *********************************************************************
 * Evernote Web QuickStart
 * 
 * This application was built by Lindsay Donaghe as a simple reference 
 * implementation to authenticate through OAuth and access the Evernote 
 * notes for the authorized user.
 * 
 * You can contact Lindsay at her website: http://macrolinz.com
 * 
 * Copyright (c) 2008 Lindsay Donaghe
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * ***********************************************************************/

using System;
using System.Collections.Generic;
using System.Configuration;
using System.Net;
using System.Web;
using System.Security.Cryptography;
using System.Text;
using OAuth;

using System.Threading.Tasks;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Attributes;
using MongoDB.Driver;

using Thrift;
using Thrift.Protocol;
using Thrift.Transport;

using Evernote.EDAM.Type;
using Evernote.EDAM.UserStore;
using Evernote.EDAM.NoteStore;
using Evernote.EDAM.Error;

using k2e;

namespace EvernoteWebQuickstart
{
    /// <summary>
    /// A helper class for making oauth requests to evernote.
    /// </summary>
    public class EvernoteAuthHelper
    {
		private const string USER_EVERNOTE_CREDENTIALS = "userEvernoteCredentials";
		private const string REQUEST_KEY_OAUTH_TOKEN = "oauth_token";
		private const string REQUEST_KEY_OAUTH_VERIFIER = "oauth_verifier";
        private const string RESPONSE_KEY_EDAM_NOTESTORE_URL = "edam_noteStoreUrl";

        // TODO: replace this url with the production one when ready
		private static readonly string EvernoteHost = 
			string.IsNullOrEmpty(ConfigurationManager.AppSettings["Production"]) ?
				"sandbox.evernote.com" :
				"www.evernote.com";
		
		private static readonly string EDAMBaseUrl = "https://" + EvernoteHost;

		private static readonly Uri OAuthBaseUri = new Uri(EDAMBaseUrl + "/oauth");

		// UserStore service endpoint
		private static readonly string UserStoreUrl = EDAMBaseUrl + "/edam/user";

        private EvernoteCredentials evernoteCredentials;

        private EvernoteAuthHelper(EvernoteCredentials ec)
        {
            this.evernoteCredentials = ec;
        }

        private EvernoteAuthHelper(string publicKey, string secretKey, string callbackURL)
        {
            this.evernoteCredentials = new EvernoteCredentials();
            evernoteCredentials.ConsumerPublicKey = publicKey;
            evernoteCredentials.ConsumerSecretKey = secretKey;
            this.GetRequestToken(callbackURL);
        }

        /// <summary>
        /// Creates an EvernoteAuthHelper depending on the oauth authentication phase we are in.
        /// </summary>
        /// <param name="callbackUrl">
        /// The url that evernote will redirect to after the user grants access to the app.
        /// It is needed if there is no existing EvernoteAuthHelper object in the current session.
        /// </param>
		/// <param name="consumerPublicKey"></param>
		/// <param name="k2eAccessToken"></param>
        /// <returns>An EvernoteAuthHelper with the relevant credentials.</returns>
        public static EvernoteAuthHelper LoadCredentials(
			string callbackUrl,
			string consumerPublicKey="",
			string k2eAccessToken="")
        {
            EvernoteCredentials ec;
            EvernoteAuthHelper eah;

			if (string.IsNullOrEmpty(consumerPublicKey) || string.IsNullOrEmpty(k2eAccessToken))
            {
				
                eah = new EvernoteAuthHelper(k2e.KeyHolder.PublicKey, 
                        k2e.KeyHolder.SecretKey, callbackUrl);
                ec = eah.evernoteCredentials;
            }
            else
            {
				var findResults = AsyncHelpers.RunSync<List<BsonDocument>>(
					() => DataStore.FindCredentials(consumerPublicKey, k2eAccessToken)
				);
				if (findResults.Count != 1)
					throw new ApiException()
					{
						Code = ErrorCode.INVALID_CREDENTIALS,
						Message = "Invalid credentials provided",
						HttpStatusCode = HttpStatusCode.Unauthorized
					};

				ec = BsonSerializer.Deserialize<EvernoteCredentials>(findResults[0]);
				eah = new EvernoteAuthHelper(ec);

				// freshen cookie and db
				var oldAccessToken = ec.K2eAccessToken;
				ec.K2eAccessToken = K2eAccessToken.Generate();

				var updateResult = AsyncHelpers.RunSync<UpdateResult>(
					() => DataStore.UpdateK2eAccessToken(ec, oldAccessToken)
				);
				if (updateResult.IsAcknowledged)
				{
					HttpContext.Current.Response.Cookies["K2eAccessToken"].Value = ec.K2eAccessToken;
					HttpContext.Current.Response.Cookies["K2eAccessToken"].Expires = DateTime.Now.AddYears(1);
				}
				else
				{
					throw new Exception("no credentials in db");
				}
            }

            if (!eah.UserIsAuthenticated && 
                HttpContext.Current.Request.QueryString[REQUEST_KEY_OAUTH_TOKEN] != null &&
                HttpContext.Current.Request.QueryString[REQUEST_KEY_OAUTH_VERIFIER] != null)
            {
                eah.evernoteCredentials.ResponseRequestToken =
                        HttpContext.Current.Request.QueryString[REQUEST_KEY_OAUTH_TOKEN].ToString();
                eah.evernoteCredentials.OauthVerifier =
                        HttpContext.Current.Request.QueryString[REQUEST_KEY_OAUTH_VERIFIER].ToString();
            }

            return eah;
        }

        /// <summary>
        /// True if the user has passed the grant access to app phase (callback url loaded).
        /// </summary>
        public bool UserIsAuthenticated
        {
            get { return (evernoteCredentials.ResponseRequestToken != null); }
        }

        /// <summary>
        /// True if the app has successfully received its access token.
        /// </summary>
        public bool AppIsAuthenticated
        {
            get { return (evernoteCredentials.AccessToken != null); }
        }

        /// <summary>
        /// True if a request token has been received.
        /// </summary>
        public bool UserRequestedLogin
        {
            get { return (evernoteCredentials.RequestToken != null); }
        }

        /// <summary>
        /// Makes a request for a request token. If the request token is
        /// in the current session, it is returned immediately.
        /// </summary>
        /// <param name="callbackURL">The callback url that evernote will redirect to. Not
        /// needed if the request token is in the current session.</param>
        /// <returns>An oauth request token.</returns>
        public string GetRequestToken(string callbackURL)
        {
            if (this.evernoteCredentials.RequestToken == null)
            {
                WebClient client = new WebClient();
                string fromUri = client.DownloadString(GetRequestTokenUri(callbackURL));

                string[] urlParams = fromUri.Split(new char[] { '&' });

                foreach (string p in urlParams)
                {
                    int paramNameLength = p.IndexOf("=");
                    string fieldName = p.Substring(0, paramNameLength);
                    if (fieldName == REQUEST_KEY_OAUTH_TOKEN)
                    {
                        this.evernoteCredentials.RequestToken = p.Substring(paramNameLength + 1);
                    }
                }

                if (this.evernoteCredentials.RequestToken == null)
                {
                    throw new Exception("oauth request token parameter not returned");
                }
            }

            return this.evernoteCredentials.RequestToken;
        }

        private Uri GetRequestTokenUri(string callbackURL)
        {
            StringBuilder sb = new StringBuilder(this.GetBaseOAuthUrl());
            sb.AppendFormat("&oauth_callback={0}", callbackURL);

            return new Uri(sb.ToString());
        }

        /// <summary>
        /// Makes a request for an access token. If the access token is
        /// in the current session, it is returned immediately. 
        /// </summary>
        /// <returns>An oauth access token</returns>
        public OAuthKey GetAccessToken()
        {
            if (evernoteCredentials.AccessToken == null)
            {
                WebClient client = new WebClient();
                string fromUri = client.DownloadString(this.GetAccessTokenUri());

                string[] urlParams = fromUri.Split(new char[] { '&' });
                int paramsFound = 0;

                evernoteCredentials.AccessToken = new OAuthKey();
                foreach (string p in urlParams)
                {
                    int paramNameLength = p.IndexOf("=");
                    string fieldName = p.Substring(0, paramNameLength);
                    if (fieldName == REQUEST_KEY_OAUTH_TOKEN)
                    {
                        evernoteCredentials.AccessToken.AuthToken =
                                HttpUtility.UrlDecode(p.Substring(paramNameLength + 1));
                        ++paramsFound;
                    }
                    else if (fieldName == RESPONSE_KEY_EDAM_NOTESTORE_URL)
                    {
                        evernoteCredentials.AccessToken.NoteStoreUrl =
                                HttpUtility.UrlDecode(p.Substring(paramNameLength + 1));
                        ++paramsFound;
                    }
                }

				if (paramsFound != 2) {
					throw new Exception ("oauth_token and/or edam_noteStoreUrl parameters not found");
				}
				else {
					evernoteCredentials.K2eAccessToken = K2eAccessToken.Generate();
					HttpContext.Current.Response.Cookies["ConsumerPublicKey"].Value = evernoteCredentials.ConsumerPublicKey;
					HttpContext.Current.Response.Cookies["ConsumerPublicKey"].Expires = DateTime.Now.AddYears(1);
					HttpContext.Current.Response.Cookies["K2eAccessToken"].Value = evernoteCredentials.K2eAccessToken;
					HttpContext.Current.Response.Cookies["K2eAccessToken"].Expires = DateTime.Now.AddYears(1);
					var replaceResult = AsyncHelpers.RunSync<ReplaceOneResult>(
						() => DataStore.InsertOrReplaceCredentials(evernoteCredentials)
					);
				}
            }

            return evernoteCredentials.AccessToken;
        }

		public void RevokeSession()
		{
			TTransport userStoreTransport = new THttpClient(new Uri(UserStoreUrl));
			TProtocol userStoreProtocol = new TBinaryProtocol(userStoreTransport);
			UserStore.Client userStore = new UserStore.Client(userStoreProtocol);
			var accessToken = this.GetAccessToken();
			var consumerPublicKey = this.evernoteCredentials.ConsumerPublicKey;
			var k2eAccessToken = this.evernoteCredentials.K2eAccessToken;

			try
			{
				userStore.revokeLongSession(accessToken.AuthToken);
				var result = AsyncHelpers.RunSync<DeleteResult>(
					() => DataStore.RemoveCredentials(consumerPublicKey, k2eAccessToken)
				);
				if (result.DeletedCount == 0)
				{
					throw new Exception("nothing to delete");
				}
			}
			catch (EDAMUserException ex)
			{
				//TODO: throw relevant API exception(s) here
				throw ex;
			}
		}

        private Uri GetAccessTokenUri()
        {
            StringBuilder sb = new StringBuilder(this.GetBaseOAuthUrl());
            sb.AppendFormat("&oauth_token={0}&oauth_verifier={1}", 
                this.evernoteCredentials.ResponseRequestToken,
                this.evernoteCredentials.OauthVerifier);

            return new Uri(sb.ToString());
        }

        private string GetBaseOAuthUrl()
        {
            OAuthBase oAuth = new OAuthBase();
            string nonce = oAuth.GenerateNonce();
            string timeStamp = oAuth.GenerateTimeStamp();

            string normalizedUrl = String.Empty;
            string normalizedRequestParameters = String.Empty;

            string sig = oAuth.GenerateSignature(OAuthBaseUri, this.evernoteCredentials.ConsumerPublicKey, 
                this.evernoteCredentials.ConsumerSecretKey, String.Empty, String.Empty, 
                "GET", timeStamp, nonce, OAuth.OAuthBase.SignatureTypes.PLAINTEXT, 
                out normalizedUrl, out normalizedRequestParameters);

            return String.Format(@"{0}?oauth_consumer_key={1}&oauth_signature={4}
                    &oauth_signature_method=PLAINTEXT&oauth_timestamp={3}&oauth_nonce={2}", 
                    OAuthBaseUri, this.evernoteCredentials.ConsumerPublicKey, nonce, timeStamp, sig);


        }
    }

    /// <summary>
    /// A container for oauth credentials.
    /// </summary>
	public class EvernoteCredentials
    {
		[BsonIgnoreIfDefault]
		public ObjectId _id { get; set; }

		public string K2eAccessToken { get; set; }
        public string ConsumerPublicKey { get; set; }
        public string ConsumerSecretKey { get; set; }
        
        public string RequestToken { get; set; }
        
        public string ResponseRequestToken { get; set; }
        public string OauthVerifier { get; set; }

        public OAuthKey AccessToken { get; set; }
    }

    /// <summary>
    /// A container for oauth token credentials
    /// </summary>
	public class OAuthKey
    {
        public string AuthToken { get; set; }
        public string NoteStoreUrl { get; set; }
        public string UserId { get; set; }
    }
}
