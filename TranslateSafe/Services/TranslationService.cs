using System.Threading.Tasks;

namespace ScreenTranslatorApp.Services
{
    public interface ITranslationService
    {
        Task<string> TranslateAsync(string text, string targetLang);
    }

    public class TranslationService : ITranslationService
    {
        // HIER KOMMT SPÄTER DER API-CODE (z.B. DeepL, Google Translate)

        // Aktuell nur ein Platzhalter zur Demonstration
        public async Task<string> TranslateAsync(string text, string targetLang)
        {
            await Task.Delay(500); // Simuliert die Wartezeit auf die API

            if (string.IsNullOrEmpty(text))
                return string.Empty;

            return $"[Übersetzung in {targetLang} von: {text}]";
        }
    }
}