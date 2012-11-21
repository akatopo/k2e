using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text;
using System.Net;

using Thrift;
using Thrift.Protocol;
using Thrift.Transport;

using Evernote.EDAM.Type;
using Evernote.EDAM.UserStore;
using Evernote.EDAM.NoteStore;
using Evernote.EDAM.Error;

using EvernoteWebQuickstart;

using Bing;

namespace k2e
{
    public class EvernoteExporter
    {
        private bool ReplaceGenericTitles;
        private HashSet<string> TagSet = new HashSet<string>();
        private HashSet<string> GenericTitleSet = null;
        private Notebook ClippingNotebook;
        private OAuthKey AccessToken;
        public readonly string ClippingNotebookName;


        private EvernoteExporter() { }
        
        public EvernoteExporter(
                OAuthKey accessTokenContainer,
                string clippingNotebookName,
                IEnumerable<string> tags,
                bool replaceGenericTitles = false,
                IEnumerable<string> genericTitles = null)
        {
            this.AccessToken = accessTokenContainer;
            this.ClippingNotebookName = clippingNotebookName;
            this.TagSet = new HashSet<string>(tags);
            this.ReplaceGenericTitles = replaceGenericTitles;
            if (replaceGenericTitles && genericTitles != null)
            {
                this.GenericTitleSet = new HashSet<string>(genericTitles);
            }
            this.ClippingNotebook = CreateOrGetNotebook(accessTokenContainer, clippingNotebookName);
        }

        private Notebook CreateOrGetNotebook(OAuthKey accessTokenContainer, string clippingNotebookName)
        {
            // Real applications authenticate with Evernote using OAuth, but for the
            // purpose of exploring the API, you can get a developer token that allows
            // you to access your own Evernote account. To get a developer token, visit 
            // https://sandbox.evernote.com/api/DeveloperToken.action
            string authToken = accessTokenContainer.AuthToken;

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

            Notebook retNotebook = null;
            bool notebookFound = false;
            foreach (Notebook notebook in notebooks)
            {
                if (notebook.Name == clippingNotebookName)
                {
                    notebookFound = true;
                    retNotebook = notebook;
                }
            }

            if (!notebookFound)
            {
                var clippingNotebook = new Notebook();
                clippingNotebook.Name = clippingNotebookName;
                retNotebook = noteStore.createNotebook(authToken, clippingNotebook);
            }
            
            return retNotebook;
        }

        private void CreateOrUpdateNote(OAuthKey accessTokenContainer,
                string clippingNotebookGuid,
                string noteTitle,
                string noteContent,
                IEnumerable<string> tags)
        {
            string authToken = accessTokenContainer.AuthToken;
            NoteFilter filter = new NoteFilter();
            string noteStoreUrl = accessTokenContainer.NoteStoreUrl;

            TTransport noteStoreTransport = new THttpClient(new Uri(noteStoreUrl));
            TProtocol noteStoreProtocol = new TBinaryProtocol(noteStoreTransport);
            NoteStore.Client noteStore = new NoteStore.Client(noteStoreProtocol);
            
            filter.NotebookGuid = clippingNotebookGuid;
            filter.Words = "intitle:" + "\"" + noteTitle + "\"";
            NoteList noteList = noteStore.findNotes(authToken, filter, 0, 1);
            List<Note> notes = (List<Note>)noteList.Notes;

            if (notes.Count == 1) // update note
            {
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
                var note = new Note();
                note.Title = noteTitle;
                note.Content =
                    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                    "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">" +
                    "<en-note>" + noteContent +
                    "</en-note>";
                note.TagNames = new List<string>(tags);
                note.NotebookGuid = clippingNotebookGuid;

                Note createdNote = noteStore.createNote(authToken, note);
            }
        }

        public bool AddTag(string tag)
        {
            return TagSet.Add(tag);
        }

        public bool RemoveTag(string tag)
        {
            return TagSet.Remove(tag);
        }

        public string[] GetTagArray()
        {
            return TagSet.ToArray();
        }

        public Notebook GetClippingNotebook()
        {
            return ClippingNotebook;
        }

        public void ExportClippings(DocumentArrayExport documentsObj)
        {
            DocumentExport[] documentArray = documentsObj.documents;
            foreach (DocumentExport d in documentArray)
            {
                // TODO:
                // maybe do hash comparisons between notes if possible


                if (this.ReplaceGenericTitles &&
                        this.GenericTitleSet != null &&
                        this.GenericTitleSet.Contains(d.title))
                {
                    ExportGenericTitleClippings(d);
                }
                else
                {
                    ExportNoteToEvernote(d);
                }
            }
        }

        private void ExportNoteToEvernote(DocumentExport document)
        {
            var noteTitle = new StringBuilder(document.title)
                    .Append(" by ")
                    .Append(document.author);
            var noteContent = new StringBuilder();

            noteContent.Append("<h1>")
                    .Append(noteTitle.ToString().HtmlEncode())
                    .Append("</h1>\n");
            foreach (ClippingExport c in document.clippings)
            {
                noteContent.Append("<h2>")
                    .Append(c.type.HtmlEncode())
                    .Append(" ").Append(c.timeStamp.HtmlEncode())
                    .Append("</h2>\n");
                noteContent.Append("<p>")
                        .Append(c.content.HtmlEncode())
                        .Append("</p>\n");
            }

            CreateOrUpdateNote(
                    accessTokenContainer: this.AccessToken,
                    clippingNotebookGuid: this.ClippingNotebook.Guid,
                    noteTitle: noteTitle.ToString(),
                    noteContent: noteContent.ToString(),
                    tags: this.TagSet);
        }

        public void ExportGenericTitleClippings(DocumentExport document)
        {
            const int MAX_QUERY_CHAR_LIMIT = 128; 
            var bingData = new BingData();
            var UrlDocumentMap = 
                new Dictionary<string, Tuple<string, List<ClippingExport> > >();
            var GenericTitleClippingList = new List<ClippingExport>();

            string origTitle = document.title;
            string origAuthor = document.author;

            foreach (ClippingExport c in document.clippings)
            {
                string q = "";
                if (c.content.IndexOf(" ") == -1) {
                    q = c.content; // or maybe some other failsafe
                }
                else if (c.content.Length < MAX_QUERY_CHAR_LIMIT)
                {
                    q = c.content.Substring(0, c.content.LastIndexOf(" ") + 1);
                }
                else 
                {
                    int length = c.content.IndexOf(" ", MAX_QUERY_CHAR_LIMIT+1) != -1?
                            c.content.IndexOf(" ", MAX_QUERY_CHAR_LIMIT+1):
                            c.content.Length;
                    q = c.content.Substring(0, length);
                }
                
                IList<WebResult> results = bingData.GetBingData(
                        Query: "\"" + q + "\"",
                        Adult: "Off");

                if (results != null && results.Count != 0) // Found a more suitable title and reference url
                {
                    string url = results[0].Url;
                    string newTitle = results[0].Title;
                    if (!UrlDocumentMap.ContainsKey(url))
                    {
                        UrlDocumentMap.Add(url,
                                Tuple.Create(newTitle,
                                        new List<ClippingExport>()));
                    }
                    UrlDocumentMap[url].Item2.Add(c);
                }
                else // keep generic title
                {
                    GenericTitleClippingList.Add(c);
                }
                
            }

            /////////////////////

            foreach (var kv in UrlDocumentMap)
            {
                string url = kv.Key;
                string title = kv.Value.Item1;
                var clippings = kv.Value.Item2;

                var noteTitle = new StringBuilder(title)
                        .Append(" from ")
                        .Append(url)
                        .Append(" originally in ")
                        .Append(origTitle)
                        .Append(" by ")
                        .Append(origAuthor);
                var noteContent = new StringBuilder();

                noteContent.Append("<h1>")
                        .Append(noteTitle.ToString().HtmlEncode())
                        .Append("</h1>\n");
                
                foreach (ClippingExport c in clippings)
                {
                    noteContent.Append("<h2>")
                        .Append(c.type.HtmlEncode())
                        .Append(" ").Append(c.timeStamp.HtmlEncode())
                        .Append("</h2>\n");
                    noteContent.Append("<p>")
                            .Append(c.content.HtmlEncode())
                            .Append("</p>\n");
                }

                CreateOrUpdateNote(
                        accessTokenContainer: this.AccessToken,
                        clippingNotebookGuid: this.ClippingNotebook.Guid,
                        noteTitle: noteTitle.ToString(),
                        noteContent: noteContent.ToString(),
                        tags: this.TagSet);
            }

            // Export any leftovers with the original generic title
            if (GenericTitleClippingList.Count != 0)
            {
                var GenericTitleDocument = new DocumentExport();
                GenericTitleDocument.author = document.author;
                GenericTitleDocument.title = document.title;
                GenericTitleDocument.clippings = GenericTitleClippingList.ToArray();

                ExportNoteToEvernote(GenericTitleDocument);
            }
        }
    }
}