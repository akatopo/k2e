using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text;

namespace k2e
{
    static public class NoteEnmlBuilder
    {
        
        static private string pStyle = "margin: 1.2em 0; color: #080808; font-family: Georgia, serif; font-size: 16px; font-style: normal; font-variant: normal; font-weight: normal; text-align: start; text-decoration: none; text-indent: 0px; text-rendering: auto; text-shadow: none; text-overflow: clip; text-transform: none; color-interpolation: srgb; color-interpolation-filters: linearrgb; color-rendering: auto; text-anchor: start;";
        
        static private string h1Style = "color: #080808; font-family: Georgia, serif; font-size: 32px; font-style: normal; font-variant: normal; font-weight: bold; text-align: start; text-decoration: none; text-indent: 0px; text-rendering: auto; text-shadow: none; text-overflow: clip; text-transform: none; color-interpolation: srgb; color-interpolation-filters: linearrgb; color-rendering: auto; text-anchor: start;";

        static private string clipHeaderStyle = "margin: 0.6em 0; color: #8D8D8D; font-family: Georgia, serif; font-size: 13px; font-style: italic; font-variant: normal; font-weight: normal; text-align: start; text-decoration: none; text-indent: 0px; text-rendering: auto; text-shadow: none; text-overflow: clip; text-transform: none; color-interpolation: srgb; color-interpolation-filters: linearrgb; color-rendering: auto; text-anchor: start;";

        static private string clipSeparatorStyle = "margin: 0 auto; width: 20%; height: 2px; border-top: 2px dotted #D7D7D4;";

        static private string subtitleItalicTextStyle = "color: #8D8D8D; font-family: Georgia, serif; font-size: 13px; font-style: italic; font-variant: normal; font-weight: normal; text-align: start; text-decoration: none; text-indent: 0px; text-rendering: auto; text-shadow: none; text-overflow: clip; text-transform: none; color-interpolation: srgb; color-interpolation-filters: linearrgb; color-rendering: auto; text-anchor: start;";

        static private string subtitleNormalTextStyle = "color: #8D8D8D; font-family: Georgia, serif; font-size: 13px; font-style: normal; font-variant: normal; font-weight: normal; text-align: start; text-decoration: none; text-indent: 0px; text-rendering: auto; text-shadow: none; text-overflow: clip; text-transform: none; color-interpolation: srgb; color-interpolation-filters: linearrgb; color-rendering: auto; text-anchor: start;";

        static private string subtitleBorderStyle = "border-top: 1px solid #D7D7D4;";

        static private string subtitleLinkStyle = "font-family: Georgia, serif; font-size: 13px; font-style: italic; font-variant: normal; font-weight: normal; text-align: start; text-decoration: none; text-indent: 0px; text-rendering: auto; text-shadow: none; text-overflow: clip; text-transform: none; color-interpolation: srgb; color-interpolation-filters: linearrgb; color-rendering: auto; text-anchor: start;";

        static private string enmediaStyle = "margin-right: 0.2em; margin-bottom: 0; margin-top: 0.2em; margin-left: 0.2em;";

        /// <summary>
        /// Creates an enml element for a given tag, style and content string
        /// </summary>
        /// <param name="tag"></param>
        /// <param name="style"></param>
        /// <param name="content"></param>
        /// <param name="htmlEncode">If true, will encode the content for html, default value is true</param>
        /// <returns></returns>
        static private string CreateElement(
                string tag, 
                string style = "", 
                string content = "", 
                bool htmlEncode = true)
        {
            var element = new StringBuilder();

            element.Append("<")
                    .Append(tag)
                    .Append(" style = \"")
                    .Append(style)
                    .Append("\">")
                    .Append(htmlEncode?content.HtmlEncode():content)
                    .Append("</")
                    .Append(tag)
                    .Append(">");

            return element.ToString();
        }

        /// <summary>
        /// Creates an 'a' element pointing to the uri described by uri
        /// </summary>
        /// <param name="style"></param>
        /// <param name="uri"></param>
        /// <returns></returns>
        static private string CreateLinkElement(string style, Uri uri)
        {
            var element = new StringBuilder();

            element.Append("<")
                    .Append("a")
                    .Append(" href = \"")
                    .Append(uri.ToString())
                    .Append("\"")
                    .Append(" style = \"")
                    .Append(style)
                    .Append("\">")
                    .Append(uri.Host.HtmlEncode())
                    .Append("</")
                    .Append("a")
                    .Append(">");

            return element.ToString();
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="style"></param>
        /// <param name="mimeType"></param>
        /// <param name="hashHex"></param>
        /// <returns></returns>
        static private string CreateEnMediaElement(
                string style, 
                string mimeType, 
                string hashHex)
        {
            var element = new StringBuilder();

            element.Append("<")
                    .Append("en-media")
                    .Append(" style = \"")
                    .Append(style)
                    .Append("\"")
                    .Append(" type = \"")
                    .Append(mimeType)
                    .Append("\"")
                    .Append(" hash = \"")
                    .Append(hashHex)
                    .Append("\"/>");

            return element.ToString();
        }

        /// <summary>
        /// Creates all the enml elements for a single clipping
        /// </summary>
        /// <param name="c"></param>
        /// <returns></returns>
        static private string CreateClipElements(ClippingExport c)
        {
            var elements = new StringBuilder();

            string typeAndLoc = CreateElement("em", clipHeaderStyle, c.type + ", " + c.loc);
            string sep = CreateElement("span", clipHeaderStyle, " | ");
            string timestamp = CreateElement("em", clipHeaderStyle, c.timeStamp);
            elements.Append(
                    CreateElement("div", clipHeaderStyle,
                            typeAndLoc + sep + timestamp, htmlEncode: false));

            elements.Append(CreateElement("p", pStyle, c.content));

            return elements.ToString();
        }


        /// <summary>
        /// Creates the enml note body('<en-note>...</en-note>', without the en-note element) for a given document
        /// </summary>
        /// <param name="document"></param>
        /// <returns></returns>
        static public string NoteBodyFromDocumentExport(DocumentExport document)
        {
            var noteBody = new StringBuilder();

            noteBody.Append(CreateElement("h1", h1Style, document.title));

            string by = CreateElement("em", subtitleItalicTextStyle, "by ");
            string author = CreateElement("span", subtitleNormalTextStyle, document.author);
            noteBody.Append(
                    CreateElement("div", subtitleBorderStyle, 
                            by + author, htmlEncode: false));
            noteBody.Append(CreateElement("br"));

            if (document.clippings.Length != 0)
            {
                ClippingExport c = document.clippings[0];
                noteBody.Append(CreateClipElements(c));

                for (int i = 1; i < document.clippings.Length; ++i)
                {
                    c = document.clippings[i];

                    noteBody.Append(CreateElement("div", clipSeparatorStyle, ""));
                    noteBody.Append(CreateElement("br"));
                    noteBody.Append(CreateClipElements(c));
                }
            }

            return noteBody.ToString();
        }

        /// <summary>
        /// Creates the evernote note content (in enml) for a given document
        /// </summary>
        /// <param name="document"></param>
        /// <returns></returns>
        static public string NoteContentFromDocumentExport(DocumentExport document)
        {
            return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                    "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">" +
                    "<en-note>" + NoteBodyFromDocumentExport(document) +
                    "</en-note>";
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="articleTitle"></param>
        /// <param name="articleUrl"></param>
        /// <param name="periodicalTitle"></param>
        /// <param name="periodicalAuthor"></param>
        /// <param name="clippings"></param>
        /// <returns></returns>
        static public string NoteBodyFromPeriodical(
                string articleTitle,
                string articleUrl,
                string periodicalTitle,
                string periodicalAuthor,
                IEnumerable<ClippingExport> clippings,
                string faviconHashHex,
                string faviconMimeType)
        {
            var noteBody = new StringBuilder();

            noteBody.Append(CreateElement("h1", h1Style, articleTitle));

            string favicon = CreateEnMediaElement(enmediaStyle, faviconMimeType, faviconHashHex);
            string link = CreateLinkElement(subtitleLinkStyle, new Uri(articleUrl));
            string separator = CreateElement("span", subtitleNormalTextStyle, " | ");
            string orig = CreateElement("em", subtitleItalicTextStyle, "Originally in ");
            string pTitle = CreateElement("span", subtitleNormalTextStyle, periodicalTitle);
            string by = CreateElement("em", subtitleItalicTextStyle, " by ");
            string pAuthor = CreateElement("span", subtitleNormalTextStyle, periodicalAuthor);

            noteBody.Append(
                    CreateElement(
                            "div", subtitleBorderStyle,
                            favicon + link + separator + orig + pTitle + by + pAuthor,
                            htmlEncode: false));
            noteBody.Append(CreateElement("br"));

            IEnumerator<ClippingExport> clipEnum =
                    clippings.GetEnumerator();
            if (clipEnum.MoveNext() == true)
            {
                ClippingExport c = clipEnum.Current;
                noteBody.Append(CreateClipElements(c));

                while (clipEnum.MoveNext() != false)
                {
                    c = clipEnum.Current;

                    noteBody.Append(CreateElement("div", clipSeparatorStyle, ""));
                    noteBody.Append(CreateElement("br"));
                    noteBody.Append(CreateClipElements(c));
                }
            }

            return noteBody.ToString();
        }

        static public string NoteContentFromPeriodical(
                string articleTitle,
                string articleUrl,
                string periodicalTitle,
                string periodicalAuthor,
                IEnumerable<ClippingExport> clippings,
                string faviconHashHex,
                string faviconMimeType)
        {
            return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>" +
                   "<!DOCTYPE en-note SYSTEM \"http://xml.evernote.com/pub/enml2.dtd\">" +
                   "<en-note>" + NoteBodyFromPeriodical(
                            articleTitle,
                            articleUrl, 
                            periodicalTitle, 
                            periodicalAuthor, 
                            clippings,
                            faviconHashHex,
                            faviconMimeType) +
                   "</en-note>";
        }
    }
}