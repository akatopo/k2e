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
                OAuthKey authTokenContainer = evernoteAuthHelper.GetAccessToken();

                // Real applications authenticate with Evernote using OAuth, but for the
                // purpose of exploring the API, you can get a developer token that allows
                // you to access your own Evernote account. To get a developer token, visit 
                // https://sandbox.evernote.com/api/DeveloperToken.action
                //String authToken = "S=s1:U=3a833:E=14238614830:C=13ae0b01c30:P=1cd:A=en-devtoken:H=adb2900def4d0a9c8b5fd1d4d9f8423e";
                string authToken = authTokenContainer.AuthToken;

                if (authToken == "your developer token")
                {
                    Console.WriteLine("Please fill in your developer token");
                    Console.WriteLine("To get a developer token, visit https://sandbox.evernote.com/api/DeveloperToken.action");
                    return;
                }

                // Initial development is performed on our sandbox server. To use the production 
                // service, change "sandbox.evernote.com" to "www.evernote.com" and replace your
                // developer token above with a token from 
                // https://www.evernote.com/api/DeveloperToken.action
                String evernoteHost = "sandbox.evernote.com";
                //String evernoteHost = "www.evernote.com";

                Uri userStoreUrl = new Uri("https://" + evernoteHost + "/edam/user");
                TTransport userStoreTransport = new THttpClient(userStoreUrl);
                TProtocol userStoreProtocol = new TBinaryProtocol(userStoreTransport);
                UserStore.Client userStore = new UserStore.Client(userStoreProtocol);

                bool versionOK =
                    userStore.checkVersion("Evernote EDAMTest (C#)",
                       Evernote.EDAM.UserStore.Constants.EDAM_VERSION_MAJOR,
                       Evernote.EDAM.UserStore.Constants.EDAM_VERSION_MINOR);
                Console.WriteLine("Is my Evernote API version up to date? " + versionOK);
                if (!versionOK)
                {
                    return;
                }

                // Get the URL used to interact with the contents of the user's account
                // When your application authenticates using OAuth, the NoteStore URL will
                // be returned along with the auth token in the final OAuth request.
                // In that case, you don't need to make this call.
                String noteStoreUrl = userStore.getNoteStoreUrl(authToken);

                TTransport noteStoreTransport = new THttpClient(new Uri(noteStoreUrl));
                TProtocol noteStoreProtocol = new TBinaryProtocol(noteStoreTransport);
                NoteStore.Client noteStore = new NoteStore.Client(noteStoreProtocol);

                // List all of the notebooks in the user's account        
                List<Notebook> notebooks = noteStore.listNotebooks(authToken);
                Console.WriteLine("Found " + notebooks.Count + " notebooks:");

                bool notebookFound = false;
                foreach (Notebook notebook in notebooks)
                {
                    if (notebook.Name == clippingNotebookName)
                    {
                        notebookFound = true;
                        ClippingNotebook = notebook;
                    }
                }

                if (!notebookFound)
                {
                    var clippingNotebook = new Notebook();
                    clippingNotebook.Name = clippingNotebookName;
                    ClippingNotebook = noteStore.createNotebook(authToken, clippingNotebook);
                    notebooks = noteStore.listNotebooks(authToken);
                }

                StringBuilder sb = new StringBuilder();
                foreach (Notebook notebook in notebooks)
                {
                    sb.AppendLine("<dl>");
                    sb.AppendLine("<dt>" + notebook.Name + "</dt>");

                    /*
                    NoteFilter filter = new NoteFilter();
                    filter.NotebookGuid = notebook.Guid;
                    NoteList noteList = noteStore.findNotes(authToken, filter, 0, 100);
                    List<Note> notes = (List<Note>)noteList.Notes;
                    sb.AppendLine("<dd>");
                    sb.AppendLine("<ul>");
                    foreach (Note note in notes)
                    {
                        sb.Append("<li><div class=\"note\"><div class=\"notetitle\">" + note.Title + "</div><div class=\"tags\">Tags: ");
                        bool hasTags = false;
                        foreach (string tag in noteStore.getNoteTagNames(authToken.AuthToken, note.Guid))
                        {
                            sb.Append(tag + ", ");
                            hasTags = true;
                        }
                        if (hasTags) sb.Remove(sb.Length - 2, 2);
                        else sb.AppendLine("[no tags]");
                        sb.AppendLine("</div></div></li>");
                    }
                    sb.AppendLine("</ul>");
                    sb.AppendLine("</dd>");
                    */
                    sb.AppendLine("</dl>");
                }

                Notebooks = sb.ToString();

                
                NoteFilter filter = new NoteFilter();
                filter.NotebookGuid = ClippingNotebook.Guid;
                string noteTitle = "sample_noteOAUTH";
                filter.Words = "intitle:" + noteTitle;
                NoteList noteList = noteStore.findNotes(authToken, filter, 0, 1);
                List<Note> notes = (List<Note>)noteList.Notes;
                string noteContent =
                    "<h1>A title</h1><p>Some content<br/>and some more</p>" +
                    "<h1>Another title</h1><p>Some content<br/>and some more update</p>";
                if (notes.Count == 1) // update note
                {
                    /*
                    sb = new StringBuilder();
                    foreach (Note note in notes)
                    {
                        sb.AppendLine("<dl>");
                        sb.AppendLine("<dt>" + note.Title + "</dt>");
                    }                
                    Clippings = sb.ToString();
                    */

                    var updatedNote = notes[0];
                    updatedNote.Content =
                        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                        "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">" +
                        "<en-note>" + noteContent +
                        "</en-note>";
                    noteStore.updateNote(authToken, updatedNote);
                }
                else // create note
                {
                    string[] tagNames = { "kindle2evernote", "sample_tag" };
                    var note = new Note();
                    note.Title = noteTitle;
                    note.Content =
                        "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                        "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">" +
                        "<en-note>" + noteContent +
                        "</en-note>";
                    note.TagNames = new List<string>(tagNames);
                    note.NotebookGuid = ClippingNotebook.Guid;

                    Note createdNote = noteStore.createNote(authToken, note);
                }
            }
        }

        public class Data
        {
            public string Str { get; set; }
            public Data2[] Arr { get; set; } 
        }

        public class Data2
        {
            public string Str2 { get; set; }
        }

        [WebMethod]
        public static string Export(Data[] q)
        {
            Notebook ClippingNotebook = null;

            var sb = new StringBuilder("");
            foreach (Data d in q)
            {
                sb.Append(d.Str);
                sb.Append(d.Arr[0].Str2);
            }
            
            OAuthKey accessTokenContainer = 
                EvernoteAuthHelper.LoadCredentials().GetAccessToken();

            // Real applications authenticate with Evernote using OAuth, but for the
            // purpose of exploring the API, you can get a developer token that allows
            // you to access your own Evernote account. To get a developer token, visit 
            // https://sandbox.evernote.com/api/DeveloperToken.action
            //String authToken = "S=s1:U=3a833:E=14238614830:C=13ae0b01c30:P=1cd:A=en-devtoken:H=adb2900def4d0a9c8b5fd1d4d9f8423e";
            string authToken = accessTokenContainer.AuthToken;

            // Initial development is performed on our sandbox server. To use the production 
            // service, change "sandbox.evernote.com" to "www.evernote.com" and replace your
            // developer token above with a token from 
            // https://www.evernote.com/api/DeveloperToken.action
            //String evernoteHost = "sandbox.evernote.com";
            //String evernoteHost = "www.evernote.com";


            // Get the URL used to interact with the contents of the user's account
            // When your application authenticates using OAuth, the NoteStore URL will
            // be returned along with the auth token in the final OAuth request.
            // In that case, you don't need to make this call.
            String noteStoreUrl = accessTokenContainer.NoteStoreUrl;

            TTransport noteStoreTransport = new THttpClient(new Uri(noteStoreUrl));
            TProtocol noteStoreProtocol = new TBinaryProtocol(noteStoreTransport);
            NoteStore.Client noteStore = new NoteStore.Client(noteStoreProtocol);

            // List all of the notebooks in the user's account        
            List<Notebook> notebooks = noteStore.listNotebooks(authToken);


            //return "Found " + notebooks.Count + " notebooks";

            bool notebookFound = false;
            foreach (Notebook notebook in notebooks)
            {
                if (notebook.Name == clippingNotebookName)
                {
                    notebookFound = true;
                    ClippingNotebook = notebook;
                }
            }

            if (!notebookFound)
            {
                var clippingNotebook = new Notebook();
                clippingNotebook.Name = clippingNotebookName;
                ClippingNotebook = noteStore.createNotebook(authToken, clippingNotebook);
                notebooks = noteStore.listNotebooks(authToken);
            }

            NoteFilter filter = new NoteFilter();
            filter.NotebookGuid = ClippingNotebook.Guid;
            string noteTitle = sb.ToString();//"sample_noteOAUTH";
            filter.Words = "intitle:" + noteTitle;
            NoteList noteList = noteStore.findNotes(authToken, filter, 0, 1);
            List<Note> notes = (List<Note>)noteList.Notes;
            string noteContent =
                "<h1>A title</h1><p>Some content<br/>and some more</p>" +
                "<h1>Another title</h1><p>Some content<br/>and some more updated__+++</p>";
            if (notes.Count == 1) // update note
            {
                /*
                sb = new StringBuilder();
                foreach (Note note in notes)
                {
                    sb.AppendLine("<dl>");
                    sb.AppendLine("<dt>" + note.Title + "</dt>");
                }                
                Clippings = sb.ToString();
                */

                var updatedNote = notes[0];
                updatedNote.Content =
                    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                    "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">" +
                    "<en-note>" + noteContent +
                    "</en-note>";
                noteStore.updateNote(authToken, updatedNote);
            }
            else // create note
            {
                string[] tagNames = { "kindle2evernote", "sample_tag" };
                var note = new Note();
                note.Title = noteTitle;
                note.Content =
                    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                    "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">" +
                    "<en-note>" + noteContent +
                    "</en-note>";
                note.TagNames = new List<string>(tagNames);
                note.NotebookGuid = ClippingNotebook.Guid;

                Note createdNote = noteStore.createNote(authToken, note);
            }

            return sb.ToString();
        }
        
    }
}
