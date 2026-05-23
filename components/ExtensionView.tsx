import React from 'react';
import { Download, Puzzle, CheckCircle2, ArrowRight, Keyboard } from 'lucide-react';

const ExtensionView: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 h-full overflow-y-auto">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/20">
          <Puzzle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">Get the LinguaGemini Assistant</h2>
        <p className="text-slate-400 max-w-xl text-lg">
          Translate web content instantly while you browse and save directly to your flashcard deck with our companion Chrome Extension.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 flex flex-col justify-between">
            <div>
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-indigo-400" />
                    Step 1: Locate Files
                </h3>
                <p className="text-slate-400 mb-6">
                    The extension source code is already included in your project folder under the 
                    <code className="bg-slate-900 px-2 py-1 rounded mx-1 text-indigo-300 font-mono text-sm">/extension</code> directory.
                </p>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 font-mono text-sm text-slate-500">
                    project-root/<br/>
                    ├── src/<br/>
                    ├── public/<br/>
                    └── <span className="text-yellow-400">extension/</span> <span className="text-slate-600">← Use this folder</span><br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;├── manifest.json<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;├── popup.html<br/>
                    &nbsp;&nbsp;&nbsp;&nbsp;└── ...
                </div>
            </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
             <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Puzzle className="w-5 h-5 text-indigo-400" />
                Step 2: Install in Chrome
            </h3>
            <ol className="space-y-4">
                <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">1</span>
                    <span className="text-slate-300">Open Chrome and navigate to <code className="text-indigo-300">chrome://extensions</code></span>
                </li>
                <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">2</span>
                    <span className="text-slate-300">Enable <b>Developer mode</b> in the top right corner.</span>
                </li>
                <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">3</span>
                    <span className="text-slate-300">Click <b>Load unpacked</b> button.</span>
                </li>
                <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold border border-indigo-500/30">4</span>
                    <span className="text-slate-300">Select the <code className="text-indigo-300">extension</code> folder from your project.</span>
                </li>
            </ol>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl p-6 flex flex-col items-start gap-4">
        <div>
            <h4 className="text-lg font-semibold text-white mb-2">Pro Tips</h4>
            <ul className="text-slate-400 text-sm space-y-2">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Use <span className="text-white font-mono bg-slate-800 px-1 rounded">Ctrl+Q</span> (or Cmd+Q) to instantly open the translator.</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Highlight text before pressing the shortcut to auto-fill.</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> If Ctrl+Q doesn't work, customize it in <code className="text-indigo-300">chrome://extensions/shortcuts</code>.</li>
            </ul>
        </div>
      </div>
    </div>
  );
};

export default ExtensionView;