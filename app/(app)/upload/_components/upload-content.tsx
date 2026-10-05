'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Camera, Upload, Loader2, CheckCircle, XCircle, Sparkles, ImageIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const ICONS: Record<string, string> = { book: '📚', globe: '🌍', calculator: '🧮', flask: '🧪', history: '🏛️', music: '🎵', art: '🎨', language: '🗣️' };

type AnalysisState = 'idle' | 'uploading' | 'analyzing' | 'completed' | 'error';

export default function UploadContent({ subjects }: { subjects: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [subjectId, setSubjectId] = useState(searchParams?.get('subjectId') ?? '');
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<AnalysisState>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [studyUnitId, setStudyUnitId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams?.get('subjectId')) setSubjectId(searchParams.get('subjectId') ?? '');
  }, [searchParams]);

  const handleFileSelect = useCallback((selectedFile: File | null | undefined) => {
    if (!selectedFile) return;
    if (!selectedFile.type.startsWith('image/')) {
      toast.error('Bitte wähle ein Bild aus');
      return;
    }
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e: any) => setPreview(e?.target?.result as string);
    reader.readAsDataURL(selectedFile);
    setState('idle');
    setError('');
  }, []);

  const handleAnalyze = async () => {
    if (!file || !subjectId) {
      toast.error('Bitte wähle ein Fach und ein Bild aus');
      return;
    }
    setState('uploading');
    setProgress(10);
    setError('');

    try {
      // 1. Get presigned upload URL
      const presignedRes = await fetch('/api/upload/presigned', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, isPublic: false }),
      });
      if (!presignedRes.ok) throw new Error('Upload-URL fehlgeschlagen');
      const { uploadUrl, cloud_storage_path } = await presignedRes.json();

      setProgress(20);

      // 2. Upload to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      if (!uploadRes.ok) throw new Error('Upload fehlgeschlagen');

      setProgress(40);
      setState('analyzing');

      // 3. Convert to base64 for LLM
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // 4. Call analyze API with streaming
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          imageBase64: base64,
          contentType: file.type,
          cloud_storage_path,
          isPublic: false,
        }),
      });

      if (!analyzeRes.ok) {
        const errData = await analyzeRes.json().catch(() => ({ error: 'Analyse fehlgeschlagen' }));
        throw new Error(errData?.error ?? 'Analyse fehlgeschlagen');
      }

      // Read SSE stream
      const reader = analyzeRes.body?.getReader();
      const decoder = new TextDecoder();
      let partialRead = '';

      if (!reader) throw new Error('Kein Stream verfügbar');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        partialRead += decoder.decode(value, { stream: true });
        const lines = partialRead.split('\n');
        partialRead = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              if (parsed?.status === 'processing') {
                setProgress((prev) => Math.min(prev + 2, 90));
              } else if (parsed?.status === 'completed') {
                setStudyUnitId(parsed?.studyUnitId ?? null);
                setProgress(100);
                setState('completed');
                toast.success('Analyse abgeschlossen!');
                return;
              } else if (parsed?.status === 'error') {
                throw new Error(parsed?.message ?? 'Analyse fehlgeschlagen');
              }
            } catch (parseErr: any) {
              if (parseErr?.message && !parseErr.message.includes('JSON')) throw parseErr;
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err?.message ?? 'Analyse fehlgeschlagen');
      setState('error');
      toast.error(err?.message ?? 'Analyse fehlgeschlagen');
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Foto hochladen</h1>
        <p className="text-muted-foreground text-sm">Fotografiere eine Schulbuchseite und die KI erstellt Zusammenfassungen und Quizfragen.</p>
      </div>

      {/* Subject selector */}
      <div className="space-y-2">
        <Label>Fach auswählen</Label>
        {(subjects ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">Erstelle zuerst ein <a href="/subjects" className="text-primary underline">Fach</a>.</p>
        ) : (
          <Select value={subjectId} onValueChange={setSubjectId}>
            <SelectTrigger>
              <SelectValue placeholder="Fach wählen..." />
            </SelectTrigger>
            <SelectContent>
              {(subjects ?? []).map((s: any) => (
                <SelectItem key={s?.id} value={s?.id ?? ''}>
                  {ICONS[s?.icon ?? ''] ?? '📚'} {s?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Image upload */}
      <Card className={`border-2 border-dashed transition-colors ${preview ? 'border-primary/30' : 'border-border hover:border-primary/50'}`}>
        <CardContent className="p-6">
          {preview ? (
            <div className="space-y-4">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
                <img src={preview} alt="Vorschau" className="w-full h-full object-contain" />
              </div>
              <Button variant="secondary" className="w-full" onClick={() => { setPreview(null); setFile(null); setState('idle'); }}>
                Anderes Bild wählen
              </Button>
            </div>
          ) : (
            <div className="text-center space-y-4 py-8">
              <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <p className="font-medium">Bild hochladen</p>
                <p className="text-sm text-muted-foreground">Mache ein Foto oder wähle ein Bild aus</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" className="gap-2" onClick={() => cameraInputRef?.current?.click?.()}>
                  <Camera className="w-4 h-4" /> Kamera
                </Button>
                <Button variant="secondary" className="gap-2" onClick={() => fileInputRef?.current?.click?.()}>
                  <Upload className="w-4 h-4" /> Datei
                </Button>
              </div>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e: any) => handleFileSelect(e?.target?.files?.[0])} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e: any) => handleFileSelect(e?.target?.files?.[0])} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis state */}
      {state === 'uploading' || state === 'analyzing' ? (
        <Card>
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="font-medium">{state === 'uploading' ? 'Bild wird hochgeladen...' : 'KI analysiert das Bild...'}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground">Das kann bis zu 30 Sekunden dauern</p>
          </CardContent>
        </Card>
      ) : state === 'completed' ? (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Analyse abgeschlossen!</span>
            </div>
            <div className="flex gap-3">
              {studyUnitId && (
                <Button className="gap-2" onClick={() => router.push(`/study/${studyUnitId}`)}>
                  <Sparkles className="w-4 h-4" /> Lerneinheit ansehen
                </Button>
              )}
              <Button variant="secondary" onClick={() => { setPreview(null); setFile(null); setState('idle'); setProgress(0); }}>
                Weiteres Foto
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : state === 'error' ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-destructive" />
              <span className="font-medium text-destructive">{error || 'Analyse fehlgeschlagen'}</span>
            </div>
            <Button variant="secondary" onClick={() => { setState('idle'); setProgress(0); }}>
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Start analysis button */}
      {state === 'idle' && preview && subjectId && (
        <Button className="w-full gap-2 h-12 text-base" onClick={handleAnalyze}>
          <Sparkles className="w-5 h-5" /> Mit KI analysieren
        </Button>
      )}
    </div>
  );
}
