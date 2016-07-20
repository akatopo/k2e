﻿/* *********************************************************************
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
using System.Configuration;
using System.Threading.Tasks;
using System.Web;
using System.Web.UI;

using k2e;

namespace EvernoteWebQuickstart
{
    /// <summary>
    /// A class for an evernote authenticated page.
    /// <para>
    /// Uses <see cref="EvernoteWebQuickstart.EvernoteAuthHelper" /> for oauth requests.
    /// </para>
    /// </summary>
    public class EvernotePage : Page
    {
        public EvernoteAuthHelper evernoteAuthHelper;
        // TODO - change this url to the production one when ready
		private static readonly string BASE_URL = 
			string.IsNullOrEmpty(ConfigurationManager.AppSettings["Production"]) ?
				"https://sandbox.evernote.com/" :
				"https://www.evernote.com/";
		
		const string FILE_PATH = "/Auth.aspx?authDone=1";
		    
		delegate string stringTransform(string s);

		private string _callbackUrl;
		public string GetCallbackUrl()
		{
			if (string.IsNullOrEmpty(_callbackUrl))
			{
				Func<int, string, string> createPortStr =
					(port, appHb) => (port == 80) || !string.IsNullOrEmpty(appHb) ? "" : (":" + port.ToString());

				Func<bool, string, string> createProtocolStr =
					(isHttps, appHb) => isHttps || !string.IsNullOrEmpty(appHb) ? Uri.UriSchemeHttps : Uri.UriSchemeHttp;

				var portStr = createPortStr(Request.Url.Port, ConfigurationManager.AppSettings["AppHbDeployment"]);
				var protocolStr = createProtocolStr(Request.IsSecureConnection, ConfigurationManager.AppSettings["AppHbDeployment"]);
				// create a callback that Evernote servers will use to pass back the authorization token
				// this will return to the same page that called it
				_callbackUrl = protocolStr + "://" +
					Request.Url.Host +
					portStr +
					FILE_PATH;
			}

			return _callbackUrl;
		}

        protected bool LoadPage()
        {
            // figure out the user for the app and pass
            // it to load that user's credentials from a data store
			var consumerPublicKey = Page.Request.Cookies.TryGetValue("ConsumerPublicKey");
			var k2eAccessToken = Page.Request.Cookies.TryGetValue("K2eAccessToken");
			var callbackUrl = GetCallbackUrl();
			evernoteAuthHelper =  EvernoteAuthHelper.LoadCredentials(callbackUrl, consumerPublicKey, k2eAccessToken);
            bool success = false;

            if (!Page.IsPostBack)
            {
                if (evernoteAuthHelper.AppIsAuthenticated)
                {
                    // we're all the way through the oAuth process
                    success = true;
                }
                else if (!evernoteAuthHelper.UserIsAuthenticated)
                {
                    

                    // The user needs to log into Evernote and allow your app access
                    string oAuthToken = evernoteAuthHelper.GetRequestToken(callbackUrl);

                    // send the access token to Evernote to allow the user to authorize the app
                    // Evernote will use the callback to send the authorization token back
                    Response.Redirect(String.Format("{0}OAuth.action?oauth_token={1}", BASE_URL, oAuthToken));
                }
                else if (evernoteAuthHelper.UserIsAuthenticated && !evernoteAuthHelper.AppIsAuthenticated)
                {
                    // this is the call to the page from the callback specified above
                    // Evernote is sending us the user's authorization token
                    try
                    {
                        // get the app authorization token and shared id
						OAuthKey authKey =  evernoteAuthHelper.GetAccessToken();

                        // we're all the way through... do stuff.
                        success = (authKey != null);
                    }
                    catch (System.Net.WebException ex)
                    {
                        // the user clicked on Decline in the Evernote app authorization dialog if the code is in here... 
                        // show a message or something
                    }
                    catch (Exception ex)
                    {
                        // some other server error, log it or do what ever you do on server errors :)
                        // show a message or something
                    }
                }

            }
            return success;
        }

    }
}
