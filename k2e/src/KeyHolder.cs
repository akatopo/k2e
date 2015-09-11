using System.Configuration;

namespace k2e
{
    public struct KeyHolder
    {
        public static string PublicKey =
                ConfigurationManager.AppSettings["PublicKey"];
        public static string SecretKey =
                ConfigurationManager.AppSettings["SecretKey"];
        public static string DeveloperToken =
                ConfigurationManager.AppSettings["DeveloperToken"];
    }
}