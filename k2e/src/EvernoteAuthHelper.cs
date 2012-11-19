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
using System.Net;
using System.Web;
using System.Text;
using OAuth;

namespace EvernoteWebQuickstart
{
    public class EvernoteAuthHelper
    {
        const string USER_EVERNOTE_CREDENTIALS = "userEvernoteCredentials";
        const string REQUEST_KEY_OAUTH_TOKEN = "oauth_token";
        const string REQUEST_KEY_OAUTH_VERIFIER = "oauth_verifier";
        const string RESPONSE_KEY_EDAM_NOTESTORE_URL = "edam_noteStoreUrl";

        // TODO - replace this url with the production one when ready
        private Uri BaseUri = new Uri("https://sandbox.evernote.com/oauth");
        private EvernoteCredentials evernoteCredentials;

        public EvernoteAuthHelper(EvernoteCredentials ec)
        {
            this.evernoteCredentials = ec;
        }

        public EvernoteAuthHelper(string publicKey, string secretKey, string callbackURL)
        {
            this.evernoteCredentials = new EvernoteCredentials();
            evernoteCredentials.ConsumerPublicKey = publicKey;
            evernoteCredentials.ConsumerSecretKey = secretKey;
            this.GetRequestToken(callbackURL);
        }

        public static EvernoteAuthHelper LoadCredentials(string callbackURL="", string user="")
        {
            // TODO - implement code to pull this information from a datastore
            // based on the user name that is provided.
            // this sample just pulls it from Session, so every time you stop the
            // webserver you'll have to authorize again.

            EvernoteCredentials ec;
            EvernoteAuthHelper eah;

            if (HttpContext.Current.Session[USER_EVERNOTE_CREDENTIALS] == null)
            {
                // TODO - put your own credentials here:                
                eah = new EvernoteAuthHelper("akatopo", "bf3076621fdd66b8", callbackURL);
                ec = eah.evernoteCredentials;
            }
            else
            {
                ec = (EvernoteCredentials)HttpContext.Current.Session[USER_EVERNOTE_CREDENTIALS];
                eah = new EvernoteAuthHelper(ec);
            }

            if (!eah.UserIsAuthenticated && 
                HttpContext.Current.Request.QueryString[REQUEST_KEY_OAUTH_TOKEN] != null &&
                HttpContext.Current.Request.QueryString[REQUEST_KEY_OAUTH_VERIFIER] != null)
            {
                eah.SetResponseRequestToken(
                        HttpContext.Current.Request.QueryString[REQUEST_KEY_OAUTH_TOKEN].ToString());
                eah.SetOauthVerifier(
                        HttpContext.Current.Request.QueryString[REQUEST_KEY_OAUTH_VERIFIER].ToString());
            }

            HttpContext.Current.Session[USER_EVERNOTE_CREDENTIALS] = ec;

            return eah;
        }

        public void SetResponseRequestToken(string authToken)
        {
            this.evernoteCredentials.ResponseRequestToken = authToken;
        }

        public void SetOauthVerifier(string oauthVerifier)
        {
            this.evernoteCredentials.OauthVerifier = oauthVerifier;
        }

        public bool UserIsAuthenticated
        {
            get { return (evernoteCredentials.ResponseRequestToken != null); }
        }

        public bool AppIsAuthenticated
        {
            get { return (evernoteCredentials.AccessToken != null); }
        }

        public bool UserRequestedLogin
        {
            get { return (evernoteCredentials.RequestToken != null); }
        }

        public string GetRequestToken(string callbackURL)
        {
            if (this.evernoteCredentials.RequestToken == null)
            {
                WebClient client = new WebClient();
                // FIXME: This is actually not the request token, just the whole server answer
                this.evernoteCredentials.RequestToken = client.DownloadString(GetRequestTokenUri(callbackURL));
            }

            return this.evernoteCredentials.RequestToken;
        }

        private Uri GetRequestTokenUri(string callbackURL)
        {
            StringBuilder sb = new StringBuilder(this.GetBaseOAuthUrl());
            sb.AppendFormat("&oauth_callback={0}", callbackURL);

            return new Uri(sb.ToString());
        }

        public OAuthKey GetAccessToken()
        {
            if (evernoteCredentials.AccessToken == null)
            {
                WebClient client = new WebClient();
                string fromURI = client.DownloadString(this.GetAccessTokenUri());

                string[] urlParams = fromURI.Split(new char[1] { '&' });

                evernoteCredentials.AccessToken = new OAuthKey();
                for (int i = 0; i < urlParams.Length; ++i)
                {
                    int paramNameLength = urlParams[i].IndexOf("=");
                    string fieldName = urlParams[i].Substring(0, paramNameLength);
                    if (fieldName == REQUEST_KEY_OAUTH_TOKEN)
                    {
                        evernoteCredentials.AccessToken.AuthToken =
                                HttpUtility.UrlDecode(urlParams[i].Substring(paramNameLength + 1));
                    }
                    else if (fieldName == RESPONSE_KEY_EDAM_NOTESTORE_URL)
                    {
                        evernoteCredentials.AccessToken.NoteStoreUrl =
                                HttpUtility.UrlDecode(urlParams[i].Substring(paramNameLength + 1));
                    }
                }
            }

            return evernoteCredentials.AccessToken;
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

            string sig = oAuth.GenerateSignature(BaseUri, this.evernoteCredentials.ConsumerPublicKey, 
                this.evernoteCredentials.ConsumerSecretKey, String.Empty, String.Empty, 
                "GET", timeStamp, nonce, OAuth.OAuthBase.SignatureTypes.PLAINTEXT, 
                out normalizedUrl, out normalizedRequestParameters);

            return String.Format("{0}?oauth_consumer_key={1}&oauth_signature={4}&oauth_signature_method=PLAINTEXT&oauth_timestamp={3}&oauth_nonce={2}", 
                BaseUri, this.evernoteCredentials.ConsumerPublicKey, nonce, timeStamp, sig);


        }
    }

    public class EvernoteCredentials
    {
        public string ConsumerPublicKey { get; set; }
        public string ConsumerSecretKey { get; set; }
        
        public string RequestToken { get; set; }
        
        public string ResponseRequestToken { get; set; }
        public string OauthVerifier { get; set; }

        public OAuthKey AccessToken { get; set; }
    }

    public class OAuthKey
    {
        public string AuthToken { get; set; }
        public string NoteStoreUrl { get; set; }
        public string UserId { get; set; }
    }
}
