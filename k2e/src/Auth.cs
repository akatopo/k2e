using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.UI;
using System.Web.UI.WebControls;
using EvernoteWebQuickstart;

namespace k2e
{
	public partial class Auth : EvernotePage
	{
		protected void Page_Load(object sender, EventArgs e)
		{
//			if (Page.Request.QueryString["authDone"] != null)
//			{
//				return;
//			}
			bool authSuccess =  base.LoadPage();
//			if (authSuccess == true)
//			{
//				Response.Redirect(GetCallbackUrl() + "?done=1");
//			}
		}
	}
}