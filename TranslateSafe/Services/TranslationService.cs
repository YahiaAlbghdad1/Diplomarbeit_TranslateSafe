using System.Threading.Tasks;

namespace TranslateSafe.Services
{
    public interface ITranslationService
    {
        Task<string> TranslateAsync(string text, string targetLang);
    }

    public class TranslationService : ITranslationService
    {
        // HIER: Später kommt die DeepL/Google API-Logik hinein
        public async Task<string> TranslateAsync(string text, string targetLang)
        {
            await Task.Delay(500); // Simuliert API-Aufruf

            if (string.IsNullOrEmpty(text))
                return string.Empty;

            // Dummy-Implementierung:
            return $"[[Übersetzt von der API in {targetLang}: {text}]]";
        }
    }
}