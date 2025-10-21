using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using TranslateSafe.Data;
using TranslateSafe.Services;
using TranslateSafe.Views;
using TranslateSafe.ViewModels;
using System;
using System.Windows;
using System.Threading.Tasks;

namespace TranslateSafe
{
    public partial class App : System.Windows.Application // Fully qualified to resolve ambiguity
    {
        private readonly IHost _host;

        public App()
        {
            _host = Host.CreateDefaultBuilder()
                .ConfigureServices(ConfigureServices)
                .Build();
        }

        private void ConfigureServices(IServiceCollection services)
        {
            // Datenbank und EF Core
            services.AddDbContext<AppDbContext>();

            // Services
            services.AddSingleton<ITranslationService, TranslationService>();
            services.AddSingleton<ISystemIntegrationService, SystemIntegrationService>();

            // Views und ViewModels
            services.AddSingleton<MainWindow>();
            services.AddTransient<MainViewModel>();
        }

        protected override async void OnStartup(StartupEventArgs e)
        {
            await _host.StartAsync();

            // Datenbankmigration durchführen
            using (var scope = _host.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                await dbContext.Database.MigrateAsync();
            }

            // Hauptfenster anzeigen
            var mainWindow = _host.Services.GetRequiredService<MainWindow>();
            mainWindow.Show();

            base.OnStartup(e);
        }

        protected override async void OnExit(ExitEventArgs e)
        {
            using (_host)
            {
                // Dienste aufräumen
                var systemIntegrationService = _host.Services.GetRequiredService<ISystemIntegrationService>();
                systemIntegrationService.Cleanup();

                await _host.StopAsync(TimeSpan.FromSeconds(5));
            }
            base.OnExit(e);
        }
    }
}