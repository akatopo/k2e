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
        // TODO - replace this url with the production one when ready
        private Uri BaseUri = new Uri("https://sandbox.evernote.com/oauth");

        public EvernoteAuthHelper(EvernoteCredentials ec)
        {
            this.ec = ec;
        }

        public EvernoteAuthHelper(string publicKey, string secretKey, string callbackURL)
        {
            this.ec = new EvernoteCredentials();
            ec.ConsumerPublicKey = publicKey;
            ec.ConsumerSecretKey = secretKey;
            this.GetAccessToken(callbackURL);
        }

        public static EvernoteAuthHelper LoadCredentials(string user, string callbackURL)
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
                ec = eah.ec;
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
                eah.SetAuthToken(HttpContext.Current.Request.QueryString[REQUEST_KEY_OAUTH_TOKEN].ToString());
                eah.SetAuthVerifier(HttpContext.Current.Request.QueryString[REQUEST_KEY_OAUTH_VERIFIER].ToString());
            }

            HttpContext.Current.Session[USER_EVERNOTE_CREDENTIALS] = ec;

            return eah;
        }

        private EvernoteCredentials ec;

        public void SetAuthToken(string authToken)
        {
            this.ec.UserAuthorizationToken = authToken;
        }

        public void SetAuthVerifier(string authVerifier)
        {
            this.ec.OauthVerifier = authVerifier;
        }

        public bool UserIsAuthenticated
        {
            get { return (ec.UserAuthorizationToken != null); }
        }

        public bool AppIsAuthenticated
        {
            get { return (ec.AppToken != null); }
        }

        public bool UserGrantedAccess
        {
            get { return (ec.UserAccessToken != null); }
        }



        public string GetAccessToken(string callbackURL)
        {
            if (this.ec.UserAccessToken == null)
            {
                WebClient client = new WebClient();
                this.ec.UserAccessToken = client.DownloadString(GenerateOAuthAccessUri(callbackURL));
            }

            return this.ec.UserAccessToken;
        }

        private Uri GenerateOAuthAccessUri(string callbackURL)
        {
            return new Uri(this.GetBaseOAuthUrl(callbackURL));
        }

        public OAuthKey GetAuthorizationToken(string callbackURL)
        {
            if (ec.AppToken == null)
            {
                WebClient client = new WebClient();
                string fromURI = client.DownloadString(this.GetAuthorizationUri(callbackURL));

                string[] amp = fromURI.Split(new char[1] { '&' });
                /*
                if (amp.Length == 4)
                {
                    ec.AppToken = new OAuthKey();
                    ec.AppToken.AuthToken = amp[0].Substring(amp[0].IndexOf("=") + 1);
                    ec.AppToken.SharedId = amp[2].Substring(amp[2].IndexOf("=") + 1);
                    ec.AppToken.NoteStoreUrl = amp[2].Substring(amp[2].IndexOf("=") + 1);
                }*/
                ec.AppToken = new OAuthKey();
                for (int i = 0; i < amp.Length; ++i)
                {
                    string fieldName = amp[i].Substring(0, amp[i].IndexOf("="));
                    if (fieldName == "oauth_token")
                    {
                        ec.AppToken.AuthToken = HttpUtility.UrlDecode(amp[i].Substring(amp[i].IndexOf("=") + 1));
                    }
                    else if (fieldName == "edam_noteStoreUrl")
                    {
                        ec.AppToken.NoteStoreUrl = HttpUtility.UrlDecode(amp[i].Substring(amp[i].IndexOf("=") + 1));
                    }
                }
            }

            return ec.AppToken;
        }

        private Uri GetAuthorizationUri(string callbackURL)
        {
            StringBuilder sb = new StringBuilder(this.GetBaseOAuthUrl2());
            sb.AppendFormat("oauth_token={0}&oauth_verifier={1}", 
                this.ec.UserAuthorizationToken,
                this.ec.OauthVerifier);

            return new Uri(sb.ToString());
        }

        private string GetBaseOAuthUrl2()
        {
            OAuthBase oAuth = new OAuthBase();
            string nonce = oAuth.GenerateNonce();
            string timeStamp = oAuth.GenerateTimeStamp();

            string normalizedUrl = String.Empty;
            string normalizedRequestParameters = String.Empty;

            string sig = oAuth.GenerateSignature(BaseUri, this.ec.ConsumerPublicKey, 
                this.ec.ConsumerSecretKey, String.Empty, String.Empty, 
                "GET", timeStamp, nonce, OAuth.OAuthBase.SignatureTypes.PLAINTEXT, 
                out normalizedUrl, out normalizedRequestParameters);

            return String.Format("{0}?oauth_consumer_key={1}&oauth_signature={4}&oauth_signature_method=PLAINTEXT&oauth_timestamp={3}&oauth_nonce={2}&", 
                BaseUri, this.ec.ConsumerPublicKey, nonce, timeStamp, sig);


        }

        private string GetBaseOAuthUrl(string callbackURL)
        {
            OAuthBase oAuth = new OAuthBase();
            string nonce = oAuth.GenerateNonce();
            string timeStamp = oAuth.GenerateTimeStamp();

            string normalizedUrl = String.Empty;
            string normalizedRequestParameters = String.Empty;
            /*
             * 
             * 
/oauth?oauth_consumer_key=<>&oauth_signature=<>&oauth_signature_method=PLAINTEXT&oauth_timestamp=<>&oauth_nonce=<>&oauth_callback=<>
             */


            // send the access token to Evernote to allow the user to authorize the app
            // Evernote will use the callback to send the authorization token back
            //Response.Redirect(String.Format("{0}OAuth.action?{1}&oauth_callback={2}", BASE_URL, oAuthToken, callbackURL));

            string sig = oAuth.GenerateSignature(BaseUri, this.ec.ConsumerPublicKey, this.ec.ConsumerSecretKey, String.Empty, String.Empty, "GET", timeStamp, nonce, OAuth.OAuthBase.SignatureTypes.PLAINTEXT, out normalizedUrl, out normalizedRequestParameters);

            return String.Format("{0}?oauth_consumer_key={1}&oauth_nonce={2}&oauth_timestamp={3}&oauth_signature_method=PLAINTEXT&oauth_signature={4}&oauth_callback={5}", BaseUri, this.ec.ConsumerPublicKey, nonce, timeStamp, sig, callbackURL);
        }
    }

    public class EvernoteCredentials
    {
        public string OauthVerifier { get; set; }
        public string ConsumerPublicKey { get; set; }
        public string ConsumerSecretKey { get; set; }
        public string UserAccessToken { get; set; }
        public string UserAuthorizationToken { get; set; }
        public OAuthKey AppToken { get; set; }
    }

    public class OAuthKey
    {
        public string AuthToken { get; set; }
        public string NoteStoreUrl { get; set; }
        public string SharedId { get; set; }
    }
}
