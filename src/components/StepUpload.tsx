import { useCallback, useState, useRef } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface StepUploadProps {
  imageFile: File | null;
  imagePreview: string | null;
  onImageSelect: (file: File, preview: string) => void;
  onClear: () => void;
  onNext: () => void;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024;

export default function StepUpload({ imageFile, imagePreview, onImageSelect, onClear, onNext }: StepUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    setError(null);
    if (!ACCEPTED.includes(file.type)) {
      setError("Formato não suportado. Use JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Arquivo muito grande. Máximo 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => onImageSelect(file, e.target?.result as string);
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  return (
    <div className="animate-fade-up max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <span className="step-badge mb-4">Step 01</span>
        <h2 className="font-display text-3xl md:text-4xl font-semibold mt-4 mb-2" style={{ lineHeight: 1.1 }}>
          Upload da Imagem
        </h2>
        <p className="text-muted-foreground font-mono text-sm">
          Envie um print, foto ou render — nossa IA faz o resto
        </p>
      </div>

      {!imagePreview ? (
        <div
          className={`upload-zone ${dragOver ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "hsl(var(--gold) / 0.1)" }}>
            <Upload className="w-7 h-7 text-gold" />
          </div>
          <p className="text-foreground font-mono text-sm mb-1">
            Arraste sua imagem ou clique para fazer upload
          </p>
          <p className="text-muted-foreground font-mono text-xs">
            JPG, PNG, WEBP • Máximo 10MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED.join(",")}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
            }}
          />
        </div>
      ) : (
        <div className="surface-card p-4 relative" style={{ animationDelay: "0.1s" }}>
          <button
            onClick={onClear}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200 z-10"
            style={{ background: "hsl(var(--surface-3))" }}
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="rounded-lg overflow-hidden mb-4" style={{ maxHeight: 400 }}>
            <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground font-mono text-xs">
              <ImageIcon className="w-4 h-4" />
              <span>{imageFile?.name}</span>
              <span>•</span>
              <span>{imageFile ? (imageFile.size / 1024 / 1024).toFixed(1) + " MB" : ""}</span>
            </div>
            <button
              onClick={onNext}
              className="gold-gradient px-6 py-2.5 rounded-lg font-mono text-sm font-medium text-primary-foreground transition-transform duration-200 active:scale-[0.97]"
            >
              Analisar Imagem →
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg text-sm font-mono text-center" style={{ background: "hsl(var(--destructive) / 0.1)", color: "hsl(var(--destructive))" }}>
          {error}
        </div>
      )}
    </div>
  );
}
