using System;
using System.ComponentModel;
using System.Threading.Tasks;
using System.Windows.Input;
using TranslateSafe.Data;
using TranslateSafe.Models;
using TranslateSafe.Services;
using System.Windows; // Achtung: Beinhaltet die mehrdeutige 'Application' Klasse

namespace TranslateSafe.ViewModels
{
    public class MainViewModel : INotifyPropertyChanged
    {
        private readonly ISystemIntegrationService _systemIntegrationService;
        private readonly ITranslationService _translationService;
        private readonly AppDbContext _dbContext;

        private string _translatedText = "Markieren Sie Text und drücken Sie STRG+SHIFT+T.";
        private string _lastOriginalText = string.Empty;

        // Konstruktor: Empfängt alle benötigten Dienste über Dependency Injection
        public MainViewModel(ISystemIntegrationService systemIntegrationService,
                             ITranslationService translationService,
                             AppDbContext dbContext)
        {
            _systemIntegrationService = systemIntegrationService;
            _translationService = translationService;
            _dbContext = dbContext;

            // Abonniere das Hotkey-Event und starte die Überwachung sofort
            _systemIntegrationService.HotkeyPressed += OnHotkeyPressed;
            _systemIntegrationService.StartMonitoring();
        }

        // Property, das den angezeigten Text im Hauptfenster steuert
        public string TranslatedText
        {
            get => _translatedText;
            set
            {
                _translatedText = value;
                OnPropertyChanged(nameof(TranslatedText));
            }
        }

        // Command zum Speichern des letzten Übersetzungs-Eintrags in die Datenbank
        public ICommand SaveCommand => new RelayCommand(ExecuteSave, CanExecuteSave);

        // Überprüft, ob der Speichern-Button aktiv sein soll
        private bool CanExecuteSave() => !string.IsNullOrEmpty(_lastOriginalText) && !TranslatedText.Contains("Fehler") && !TranslatedText.Contains("STRG+SHIFT+T");

        private void ExecuteSave()
        {
            // Erstellt neuen Datenbank-Eintrag
            var entry = new TranslationEntry
            {
                OriginalText = _lastOriginalText,
                TranslatedText = TranslatedText,
                SourceLanguage = "auto",
                TargetLanguage = "de",
                CreationDate = DateTime.Now
            };

            _dbContext.TranslationEntries.Add(entry);
            _dbContext.SaveChanges();

            TranslatedText = "Übersetzung erfolgreich gespeichert!";
        }

        // Event-Handler, der aufgerufen wird, wenn der globale Hotkey gedrückt wird
        private void OnHotkeyPressed(object sender, EventArgs e)
        {
            // WICHTIG: UI-Thread-Switch
            // Wechselt zum WPF-Haupt-Thread, um UI-Updates (TranslatedText) und Clipboard-Zugriff sicherzustellen
            System.Windows.Application.Current.Dispatcher.Invoke(async () =>
            {
                await ExecuteTranslate();
            });
        }

        private async Task ExecuteTranslate()
        {
            TranslatedText = "Text wird erfasst...";

            // 1. Markierten Text über Clipboard-Trick erfassen
            string selectedText = await _systemIntegrationService.GetSelectedTextAsync();

            if (string.IsNullOrWhiteSpace(selectedText))
            {
                TranslatedText = "Fehler: Kein markierbarer Text gefunden. Wurde der Text kopiert?";
                return;
            }

            _lastOriginalText = selectedText;
            TranslatedText = "Text wird übersetzt...";

            try
            {
                // 2. Text übersetzen (Platzhalter-API)
                string translation = await _translationService.TranslateAsync(selectedText, "DE");

                // 3. Ergebnis anzeigen
                TranslatedText = translation;
            }
            catch (Exception ex)
            {
                TranslatedText = $"Übersetzungsfehler: {ex.Message}";
            }
        }

        // Aufräumen (Garbage Collector wird das Objekt entfernen)
        ~MainViewModel()
        {
            _systemIntegrationService.HotkeyPressed -= OnHotkeyPressed;
            _systemIntegrationService.Cleanup();
        }

        // ----- Boilerplate für MVVM -----
        public event PropertyChangedEventHandler PropertyChanged;
        protected void OnPropertyChanged(string propertyName)
        {
            PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
        }
    }
}