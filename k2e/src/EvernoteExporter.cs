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

namespace k2e
{
    public class EvernoteExporter
    {
        private HashSet<string> TagSet = new HashSet<string>();
        private Notebook ClippingNotebook { get; set; }
        private OAuthKey AccessToken { get; set; }
        public readonly string ClippingNotebookName;


        private EvernoteExporter() { }
        
        public EvernoteExporter(OAuthKey accessTokenContainer, string clippingNotebookName, IEnumerable<string> tags)
        {
            this.AccessToken = accessTokenContainer;
            this.ClippingNotebookName = clippingNotebookName;
            this.TagSet = new HashSet<string>(tags);
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
            filter.Words = "intitle:" + noteTitle;
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
                // Could check for generic titles at this point, and use
                // heuristics to resolve proper title for each clipping
                // Also maybe do hash comparisons between notes if possible

                var noteTitle = new StringBuilder(d.title).Append(" by ").Append(d.author);
                var noteContent = new StringBuilder();

                noteContent.Append("<h1>").Append(noteTitle.ToString().HtmlEncode()).Append("</h1>\n");
                foreach (ClippingExport c in d.clippings)
                {
                    noteContent.Append("<h2>").Append(c.type.HtmlEncode()).
                        Append(" ").Append(c.timeStamp.HtmlEncode()).Append("</h2>\n");
                    noteContent.Append("<p>").Append(c.content.HtmlEncode()).Append("</p>\n");
                }

                CreateOrUpdateNote(
                        accessTokenContainer: this.AccessToken,
                        clippingNotebookGuid: this.ClippingNotebook.Guid,
                        noteTitle: noteTitle.ToString(),
                        noteContent: noteContent.ToString(),
                        tags: this.TagSet);
            }

        }
    }
}