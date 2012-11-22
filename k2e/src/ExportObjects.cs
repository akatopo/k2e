namespace k2e
{
    public class DocumentArrayExport
    {
        public DocumentExport[] documents { get; set; }
    }

    public class DocumentExport
    {
        public string title { get; set; }
        public string author { get; set; }
        public bool isPeriodical { get; set; }
        public ClippingExport[] clippings { get; set; }
    }

    public class ClippingExport
    {
        public string type { get; set; }
        public string loc { get; set; }
        public string timeStamp { get; set; }
        public string content { get; set; }
        public string suggestedTitle { get; set; }
        public string suggestedUrl { get; set; }
    }
}