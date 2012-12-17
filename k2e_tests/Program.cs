using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Security.Cryptography;

using Thrift.Transport;
using Thrift.Protocol;

using Evernote.EDAM.UserStore;
using Evernote.EDAM.NoteStore;
using Evernote.EDAM.Type;

using k2e;
using System.Net;

namespace k2e_tests
{
    class Program
    {
        static ClippingExport[] test_article_clippings = {
            new ClippingExport() { 
                    content = "Some content",
                    loc = "Loc. 441-43",
                    suggestedTitle = "Article Title",
                    suggestedUrl = "http://www.example.com/file/path.html",
                    timeStamp = "November 13, 2011, 04:56 PM",
                    type = "Highlight"},
            new ClippingExport() { 
                    content = "Some more content",
                    loc = "Loc. 451-43",
                    suggestedTitle = "Article Title",
                    suggestedUrl = "http://www.example.com/file/path.html",
                    timeStamp = "November 13, 2011, 05:56 PM",
                    type = "Highlight"},
            new ClippingExport() { 
                    content = "Some more more content",
                    loc = "Loc. 461-43",
                    suggestedTitle = "Article Title",
                    suggestedUrl = "http://www.example.com/file/path.html",
                    timeStamp = "November 13, 2011, 06:56 PM",
                    type = "Highlight"},
            new ClippingExport() { 
                    content = "Some morerer content",
                    loc = "Loc. 471-43",
                    suggestedTitle = "Article Title",
                    suggestedUrl = "http://www.example.com/file/path.html",
                    timeStamp = "November 13, 2011, 07:56 PM",
                    type = "Highlight"},

        };

        static string test_article_title = "Article Title";

        static string test_article_url = "http://www.google.com/file/path.html";

        static string test_orig_title = "Orig Title";

        static string test_orig_author = "Orig Author";

        static void Main(string[] args)
        {// Real applications authenticate with Evernote using OAuth, but for the
            // purpose of exploring the API, you can get a developer token that allows
            // you to access your own Evernote account. To get a developer token, visit 
            // https://sandbox.evernote.com/api/DeveloperToken.action
            String authToken = KeyHolder.DeveloperToken;


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
            foreach (Notebook notebook in notebooks)
            {
                Console.WriteLine("  * " + notebook.Name);
            }

            Console.WriteLine();
            Console.WriteLine("Creating a note in the default notebook");
            Console.WriteLine();

            // To create a new note, simply create a new Note object and fill in 
            // attributes such as the note's title.
            Note note = new Note();
            note.Title = "Test note from EDAMTest.cs";

            string mimeType = "";
            byte[] imgBytes = FaviconFetcher.GetBytes(new Uri(test_article_url), out mimeType);

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
                Mime = mimeType,
                Data = imgData
            };

            note.Resources = new List<Resource>();
            note.Resources.Add(imgResource);

            string hashHex = 
                BitConverter.ToString(imgHash).Replace("-", "").ToLower();

            // The content of an Evernote note is represented using Evernote Markup Language
            // (ENML). The full ENML specification can be found in the Evernote API Overview
            // at http://dev.evernote.com/documentation/cloud/chapters/ENML.php
            note.Content =
                    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                    "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">" +
                    "<en-note>" +
                    NoteEnmlBuilder.NoteBodyFromPeriodical(
                            test_article_title,
                            test_article_url,
                            test_orig_title,
                            test_orig_author,
                            test_article_clippings,
                            hashHex,
                            mimeType) +
                    "</en-note>";
                    

            // Finally, send the new note to Evernote using the createNote method
            // The new Note object that is returned will contain server-generated
            // attributes such as the new note's unique GUID.
            Note createdNote = noteStore.createNote(authToken, note);

            Console.WriteLine("Successfully created new note with GUID: " + createdNote.Guid);
            Console.Read();
        }
    }
}
