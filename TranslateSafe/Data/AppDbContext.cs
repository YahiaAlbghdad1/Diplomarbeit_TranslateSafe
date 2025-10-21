using Microsoft.EntityFrameworkCore;
using TranslateSafe.Models;
using System.IO;

namespace TranslateSafe.Data
{
    public class AppDbContext : DbContext
    {
        public DbSet<TranslationEntry> TranslationEntries { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            string dbPath = Path.Combine(Directory.GetCurrentDirectory(), "translations.db");
            optionsBuilder.UseSqlite($"Data Source={dbPath}");
        }
    }
}