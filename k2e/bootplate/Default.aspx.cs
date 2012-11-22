using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Services;
using System.Web.UI;
using System.Web.UI.WebControls;
using System.Text;

using Thrift;
using Thrift.Protocol;
using Thrift.Transport;
using Evernote.EDAM.Type;
using Evernote.EDAM.UserStore;
using Evernote.EDAM.NoteStore;
using Evernote.EDAM.Error;
using EvernoteWebQuickstart;

namespace k2e
{
    public partial class _Default : EvernoteWebQuickstart.EvernotePage
    {
        public string Notebooks { get; set; }
        public string Clippings{ get; set; }
        private Notebook ClippingNotebook { get; set;}
        protected const string clippingNotebookName = "Kindle Clippings";

        protected void Page_Load(object sender, EventArgs e)
        {
            bool authSuccess = base.LoadPage();
            // FIXME
            if (authSuccess && false)
            {
 
            }
        }

        [WebMethod]
        public static string Export(DocumentArrayExport q)
        {
            OAuthKey accessTokenContainer = 
                EvernoteAuthHelper.LoadCredentials().GetAccessToken();
            
            var exporter = new EvernoteExporter(
                accessTokenContainer: accessTokenContainer,
                clippingNotebookName: "Kindle Clippings",
                tags: new string[] { "k2e", "kindle_clippings" },
                replaceGenericTitles: true,
                genericTitles: new string[] { "Instapaper" });

            exporter.ExportClippings(q);

            return ":-D";
         
        }
        
    }
}
