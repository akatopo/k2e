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
using System.Web;
using System.Web.UI;

namespace EvernoteWebQuickstart
{
    public class EvernotePage : Page
    {
        public EvernoteAuthHelper eah;
        // TODO - change this url to the production one when ready
        const string BASE_URL = "https://sandbox.evernote.com/";

        public string callbackURL
        {
            get;
            private set;
        }

        protected bool LoadPage()
        {
            // create a callback that Evernote servers will use to pass back the authorization token
            // this will return to the same page that called it
            callbackURL = "http://" + Request.ServerVariables["SERVER_NAME"].ToString() + 
                                Page.Request.FilePath;

            // TODO - figure out the user for the app and pass
            // it to load that user's credentials from a data store
            eah = EvernoteAuthHelper.LoadCredentials("me", callbackURL);
            bool success = false;

            if (!Page.IsPostBack)
            {
                if (eah.AppIsAuthenticated)
                {
                    // we're all the way through the oAuth process
                    success = true;
                }
                else if (!eah.UserIsAuthenticated)
                {
                    

                    // The user needs to log into Evernote and allow your app access
                    string oAuthToken = eah.GetAccessToken(callbackURL);

                    // send the access token to Evernote to allow the user to authorize the app
                    // Evernote will use the callback to send the authorization token back
                    Response.Redirect(String.Format("{0}OAuth.action?{1}", BASE_URL, oAuthToken));
                }
                else if (eah.UserGrantedAccess && !eah.AppIsAuthenticated)
                {
                    // this is the call to the page from the callback specified above
                    // Evernote is sending us the user's authorization token
                    try
                    {
                        // get the app authorization token and shared id
                        OAuthKey authKey = eah.GetAuthorizationToken(callbackURL);

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
