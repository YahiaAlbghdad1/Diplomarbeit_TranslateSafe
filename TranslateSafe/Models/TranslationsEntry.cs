using System;

namespace ScreenTranslatorApp.Models
{
    public class TranslationEntry
    {
        // Primärschlüssel für die Datenbank
        public int Id { get; set; }

        // Der vom Benutzer markierte Originaltext
        public string OriginalText { get; set; }

        // Die erhaltene Übersetzung
        public string TranslatedText { get; set; }

        // Die Quellsprache des Originaltextes
        public string SourceLanguage { get; set; }

        // Die Zielsprache der Übersetzung
        public string TargetLanguage { get; set; }

        // Zeitpunkt der Speicherung/Erstellung (für Sortierung und Flashcard-Algorithmus)
        public DateTime CreationDate { get; set; }

        // Optionale Kategorie für Flashcards (z.B. "Technik", "Freizeit")
        public string Category { get; set; }
    }
}