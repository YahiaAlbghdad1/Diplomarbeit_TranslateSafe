using TranslateSafe.ViewModels;
using System.Windows;

namespace TranslateSafe.Views
{
    public partial class MainWindow : Window
    {
        // Dies ist der EINZIGE Konstruktor. Er empfängt das ViewModel über DI.
        public MainWindow(MainViewModel viewModel)
        {
            InitializeComponent();

            // Setzt das ViewModel als Datenkontext für die XAML-Bindungen
            this.DataContext = viewModel;
        }

        // ACHTUNG: Der public MainWindow() { ... } Konstruktor MUSS GELÖSCHT WERDEN!
    }
}