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

        static private string subtitleTextStyle = "color: #8D8D8D; font-family: Georgia, serif; font-size: 13px; font-style: italic; font-variant: normal; font-weight: normal; text-align: start; text-decoration: none; text-indent: 0px; text-rendering: auto; text-shadow: none; text-overflow: clip; text-transform: none; color-interpolation: srgb; color-interpolation-filters: linearrgb; color-rendering: auto; text-anchor: start;";

        static private string subtitleBorderStyle = "border-top: 1px solid #D7D7D4;";

        static private string CreateElement(string tag, string style, string content, bool htmlEncode = true)
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

        static public string NoteBodyFromDocumentExport(DocumentExport document)
        {
            var noteBody = new StringBuilder();

            noteBody.Append(CreateElement("h1", h1Style, document.title));

            string by = CreateElement("em", subtitleTextStyle, "by ");
            string author = CreateElement("span", subtitleTextStyle, document.author);
            noteBody.Append(
                    CreateElement("div", subtitleBorderStyle, 
                            by + author, htmlEncode: false));

            if (document.clippings.Length != 0)
            {
                ClippingExport c = document.clippings[0];
                noteBody.Append(CreateClipElements(c));

                for (int i = 1; i < document.clippings.Length; ++i)
                {
                    c = document.clippings[i];

                    noteBody.Append(CreateElement("div", clipSeparatorStyle, ""));

                    noteBody.Append(CreateClipElements(c));
                }
            }

            return noteBody.ToString();
        }

        static public string NoteContentFromDocumentExport(DocumentExport d)
        {
            return "";
        }
    }
}