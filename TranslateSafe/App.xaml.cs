using Microsoft.Extensions.DependencyInjection;
using ScreenTranslatorApp.Services;
using System.Windows;

namespace TranslateSafe // HIER IST IHR PROJEKTNAME (NAMESPACE)
{
    public partial class App : Application
    {
        // ... (Der restliche Code bleibt, nur die using-Anweisungen wurden korrigiert) ...

        private void ConfigureServices(IServiceCollection services)
        {
            // 1. REGISTRIERUNG DER DATENBANK
            services.AddDbContext<AppDbContext>();

            // 2. REGISTRIERUNG DER SERVICES
            services.AddSingleton<ITranslationService, TranslationService>();
            services.AddSingleton<ISystemIntegrationService, SystemIntegrationService>();

            // 3. REGISTRIERUNG DER VIEWS und VIEWMODELS
            services.AddSingleton<MainWindow>();
            services.AddTransient<MainViewModel>();
        }

        // ... (restliche Methoden OnStartup und OnExit bleiben gleich) ...
    }
}