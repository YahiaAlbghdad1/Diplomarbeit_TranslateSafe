using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System;
using System.Windows;
using System.Diagnostics;
using System.ComponentModel;
using System.Windows.Forms; // Erfordert NuGet-Paket/Framework-Referenz
using System.Windows.Interop;

namespace TranslateSafe.Services
{
    public interface ISystemIntegrationService
    {
        event EventHandler HotkeyPressed;
        void StartMonitoring();
        Task<string> GetSelectedTextAsync();
        void Cleanup();
    }

    public class SystemIntegrationService : ISystemIntegrationService
    {
        private const int MOD_ALT = 0x0001;
        private const int VK_T = 0x54;
        private const int HOTKEY_ID = 9000;
        private const int WM_HOTKEY = 0x0312;

        [DllImport("user32.dll")]
        private static extern bool RegisterHotKey(IntPtr hWnd, int id, int fsModifiers, int vk);

        [DllImport("user32.dll")]
        private static extern bool UnregisterHotKey(IntPtr hWnd, int id);

        public event EventHandler? HotkeyPressed;
        private HwndSource? _source;

        public void StartMonitoring()
        {
            var parameters = new HwndSourceParameters("HotkeyWindow")
            {
                Width = 0,
                Height = 0,
                ParentWindow = IntPtr.Zero,
                WindowStyle = unchecked((int)(0x80000000 | 0x40000000)), // Use unchecked to avoid CS0221
            };

            _source = new HwndSource(parameters);
            _source.AddHook(WndProc);

            // Hotkey registrieren: Strg + Shift + T
            if (!RegisterHotKey(_source.Handle, HOTKEY_ID, MOD_ALT, VK_T))
            {
                Debug.WriteLine($"Hotkey-Registrierung fehlgeschlagen! Fehler: {Marshal.GetLastWin32Error()}");
                // Nur werfen, wenn es sich um einen kritischen Fehler handelt, der die App blockiert
            }
            else
            {
                Debug.WriteLine("Hotkey (Strg+Shift+T) erfolgreich registriert.");
            }
        }

        private IntPtr WndProc(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
        {
            if (msg == WM_HOTKEY && wParam.ToInt32() == HOTKEY_ID)
            {
                HotkeyPressed?.Invoke(this, EventArgs.Empty);
                handled = true;
            }
            return IntPtr.Zero;
        }

        public async Task<string> GetSelectedTextAsync()
        {
            string? originalClipboardContent = null;
            if (System.Windows.Clipboard.ContainsText())
            {
                // Speichere den aktuellen Inhalt, um ihn wiederherzustellen
                originalClipboardContent = System.Windows.Clipboard.GetText();
            }

            // Simuliere Strg+C
            SendKeys.SendWait("^(c)");

            // Kurze Wartezeit für das Betriebssystem
            await Task.Delay(150);

            string? selectedText = null;
            if (System.Windows.Clipboard.ContainsText())
            {
                selectedText = System.Windows.Clipboard.GetText();
            }

            // Originalen Clipboard-Inhalt wiederherstellen
            if (originalClipboardContent != null && selectedText != originalClipboardContent)
            {
                System.Windows.Clipboard.SetText(originalClipboardContent);
            }

            return selectedText ?? string.Empty;
        }

        public void Cleanup()
        {
            if (_source != null)
            {
                UnregisterHotKey(_source.Handle, HOTKEY_ID);
                _source.RemoveHook(WndProc);
                _source.Dispose();
                _source = null;
            }
        }

        ~SystemIntegrationService()
        {
            Cleanup();
        }
    }
}