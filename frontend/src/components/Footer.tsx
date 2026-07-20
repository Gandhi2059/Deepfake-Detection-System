export default function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-8 text-center mt-auto">
      <div className="container mx-auto px-4">
        <h3 className="text-lg font-semibold text-slate-300 mb-2">AI-Based Deepfake Detection System</h3>
        <p className="mb-2 text-sm">Research Project Assessment Platform</p>
        <div className="flex justify-center space-x-4 text-xs mt-4 mb-6">
          <span>Developer: Gandhi raj giri</span>
          <span>|</span>
          <span>Institution: Nirvana Secure</span>
          <span>|</span>
          <span>Email: rajgiri@gmail.com</span>
        </div>
        <div className="text-xs text-slate-500 max-w-2xl mx-auto border border-slate-800 p-3 rounded bg-slate-900/50">
          <strong>Disclaimer:</strong> This system provides AI-based prediction and should be used as an assistive forensic tool, not as absolute legal evidence.
        </div>
      </div>
    </footer>
  );
}
