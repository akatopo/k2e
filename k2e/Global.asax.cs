﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.SessionState;

namespace k2e
{
    public class Global : System.Web.HttpApplication
    {
		void Application_BeginRequest(object sender, EventArgs e)
		{
			if (HttpContext.Current.Request.IsLocal)
			{
				return;
			}
			if (HttpContext.Current.Request.IsSecureConnection)
			{
				return;
			}
			if (!string.IsNullOrEmpty(HttpContext.Current.Request.Headers["X-Forwarded-Proto"]))
			{
				var uriScheme = HttpContext.Current.Request.Headers["X-Forwarded-Proto"];
				if (string.Equals(uriScheme, Uri.UriSchemeHttps, StringComparison.InvariantCultureIgnoreCase))
					return;
			}
			Response.Redirect(Uri.UriSchemeHttps + "://" + HttpContext.Current.Request.Url.Host + HttpContext.Current.Request.Url.PathAndQuery);
		}


        void Application_Start(object sender, EventArgs e)
        {
            // Code that runs on application startup

        }

        void Application_End(object sender, EventArgs e)
        {
            //  Code that runs on application shutdown

        }

        void Application_Error(object sender, EventArgs e)
        {
            // Code that runs when an unhandled error occurs

        }

        void Session_Start(object sender, EventArgs e)
        {
            // Code that runs when a new session is started

        }

        void Session_End(object sender, EventArgs e)
        {
            // Code that runs when a session ends. 
            // Note: The Session_End event is raised only when the sessionstate mode
            // is set to InProc in the Web.config file. If session mode is set to StateServer 
            // or SQLServer, the event is not raised.

        }

    }
}
