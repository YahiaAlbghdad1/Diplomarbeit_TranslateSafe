using System.Threading.Tasks;

namespace ScreenTranslatorApp.Services
{
    // Die Schnittstelle (Interface): Definiert, WAS der Dienst tun muss
    public interface ISystemIntegrationService
    {
        // Methode zum Starten der Überwachung des Shortcuts
        void StartMonitoring();

        // Methode zum Abrufen des markierten Textes (über das Clipboard)
        Task<string> GetSelectedTextAsync();
    }

    // Die Klasse: Implementiert die Logik des Dienstes
    public class SystemIntegrationService : ISystemIntegrationService
    {
        // Platzhalter für die StartMonitoring-Methode
        public void StartMonitoring()
        {
            // Später: Logik zum Registrieren des globalen Shortcuts
            System.Diagnostics.Debug.WriteLine("System Integration Monitoring gestartet.");
        }

        // Platzhalter für die GetSelectedText-Methode
        public async Task<string> GetSelectedTextAsync()
        {
            // Später: Logik zum Kopieren (Strg+C simulieren) und Clipboard auslesen
            await Task.Delay(100); // Simuliert die Systemwartezeit
            return "Markierter Text von der Webseite"; // Platzhalter-Rückgabe
        }
    }
}