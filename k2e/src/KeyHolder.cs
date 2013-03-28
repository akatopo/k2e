namespace k2e
{
    public struct KeyHolder
    {
        // TODO: put your own credentials here: 
        public static string PublicKey =
                System.Configuration.ConfigurationManager.AppSettings["PublicKey"];
        public static string SecretKey =
                System.Configuration.ConfigurationManager.AppSettings["SecretKey"];
        public static string DeveloperToken =
                System.Configuration.ConfigurationManager.AppSettings["DeveloperToken"];
    }
}