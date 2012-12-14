﻿using System;
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
using System.Security.Cryptography;

//using Bing;

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
                IEnumerable<string> tags,
                Resource faviconResource = null)
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
                updatedNote.Content = noteContent;

                // in case of a favicon update
                if (faviconResource != null)
                {
                    updatedNote.Resources = new List<Resource>();
                    updatedNote.Resources.Add(faviconResource);
                }

                noteStore.updateNote(authToken, updatedNote);
            }
            else // create note
            {
                var note = new Note();
                note.Title = noteTitle;
                note.Content = noteContent;
                note.TagNames = new List<string>(tags);
                note.NotebookGuid = clippingNotebookGuid;

                if (faviconResource != null)
                {
                    note.Resources = new List<Resource>();
                    note.Resources.Add(faviconResource);
                }

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


                //if (this.ReplaceGenericTitles &&
                //        this.GenericTitleSet != null &&
                //        this.GenericTitleSet.Contains(d.title))
                if (d.isPeriodical)
                {
                    ExportPeriodicalDocument(d);
                }
                else
                {
                    ExportDocumentToEvernote(d);
                }
            }
        }

        private void ExportDocumentToEvernote(DocumentExport document)
        {
            var noteTitle = new StringBuilder(document.title)
                    .Append(" by ")
                    .Append(document.author);
            string noteContent = NoteEnmlBuilder.NoteContentFromDocumentExport(document);

            CreateOrUpdateNote(
                    accessTokenContainer: this.AccessToken,
                    clippingNotebookGuid: this.ClippingNotebook.Guid,
                    noteTitle: noteTitle.ToString(),
                    noteContent: noteContent,
                    tags: this.TagSet);
        }

        public void ExportPeriodicalDocument(DocumentExport document)
        {
            //const int MAX_QUERY_CHAR_LIMIT = 128; 
            //var bingData = new BingData();
            var UrlClippingsMap = 
                new Dictionary<string, Tuple<string, List<ClippingExport> > >();
            var GenericTitleClippingList = new List<ClippingExport>();

            string origTitle = document.title;
            string origAuthor = document.author;

            // Separate clippings that belong to an article from a periodical

            foreach (ClippingExport c in document.clippings)
            {
                if (c.suggestedTitle != "" && c.suggestedUrl != "")
                {
                    string url = c.suggestedUrl; //results[0].Url;
                    string newTitle = c.suggestedTitle; //results[0].Title;
                    if (!UrlClippingsMap.ContainsKey(url))
                    {
                        UrlClippingsMap.Add(url,
                                Tuple.Create(newTitle,
                                        new List<ClippingExport>()));
                    }
                    UrlClippingsMap[url].Item2.Add(c);
                }
                else // keep generic title
                {
                    GenericTitleClippingList.Add(c);
                }
                
            }

            // Export periodial articles by url

            foreach (var kv in UrlClippingsMap)
            {
                string url = kv.Key;
                string title = kv.Value.Item1;
                List<ClippingExport> clippings 
                        = kv.Value.Item2;


                string imgMimeType = "";
                byte[] imgBytes = 
                        FaviconFetcher.GetBytes(new Uri(url), out imgMimeType);
                byte[] imgHash =
                        new MD5CryptoServiceProvider().ComputeHash(imgBytes);

                var imgData = new Data()
                {
                    Size = imgBytes.Length,
                    BodyHash = imgHash,
                    Body = imgBytes
                };

                var imgResource = new Resource()
                {
                    Mime = imgMimeType,
                    Data = imgData
                };

                string imgHashHex =
                    BitConverter.ToString(imgHash).Replace("-", "").ToLower();
                

                var noteTitle = new StringBuilder(title)
                        .Append(" from ")
                        .Append(url)
                        .Append(" originally in ")
                        .Append(origTitle)
                        .Append(" by ")
                        .Append(origAuthor);

                string noteContent =
                        NoteEnmlBuilder.NoteContentFromPeriodical(
                                title,
                                url,
                                origTitle,
                                origAuthor, 
                                clippings,
                                imgHashHex, imgMimeType);

                CreateOrUpdateNote(
                        accessTokenContainer: this.AccessToken,
                        clippingNotebookGuid: this.ClippingNotebook.Guid,
                        noteTitle: noteTitle.ToString(),
                        noteContent: noteContent,
                        tags: this.TagSet,
                        faviconResource: imgResource);
            }

            // Export any leftovers with the original generic title
            if (GenericTitleClippingList.Count != 0)
            {
                var GenericTitleDocument = new DocumentExport();
                GenericTitleDocument.author = document.author;
                GenericTitleDocument.title = document.title;
                GenericTitleDocument.clippings = GenericTitleClippingList.ToArray();

                ExportDocumentToEvernote(GenericTitleDocument);
            }
        }
    }
}