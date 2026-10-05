'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, Trophy, Sparkles, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const ICONS: Record<string, string> = { book: '📚', globe: '🌍', calculator: '🧮', flask: '🧪', history: '🏛️', music: '🎵', art: '🎨', language: '🗣️' };

type QuizState = 'quiz' | 'result';

export default function QuizContent({ studyUnit }: { studyUnit: any }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<any[]>(studyUnit?.questions ?? []);
  const [shuffled, setShuffled] = useState(false);

  // Shuffle once on mount (client-only)
  useEffect(() => {
    if (shuffled) return;
    const all = [...(studyUnit?.questions ?? [])];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    setQuestions(all);
    setShuffled(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { correct: boolean }>>({});
  const [quizState, setQuizState] = useState<QuizState>('quiz');
  const [saving, setSaving] = useState(false);

  // MC state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [mcRevealed, setMcRevealed] = useState(false);

  // Open state
  const [openAnswer, setOpenAnswer] = useState('');
  const [openRevealed, setOpenRevealed] = useState(false);

  const currentQ = questions?.[currentIndex];
  const totalQuestions = questions?.length ?? 0;
  const progressPct = totalQuestions > 0 ? ((currentIndex) / totalQuestions) * 100 : 0;

  const handleMcSelect = useCallback((idx: number) => {
    if (mcRevealed) return;
    setSelectedOption(idx);
    setMcRevealed(true);
    const isCorrect = idx === (currentQ?.correctOption ?? -1);
    setAnswers((prev) => ({ ...(prev ?? {}), [currentQ?.id ?? '']: { correct: isCorrect } }));
  }, [mcRevealed, currentQ]);

  const handleOpenSelfGrade = useCallback((correct: boolean) => {
    setAnswers((prev) => ({ ...(prev ?? {}), [currentQ?.id ?? '']: { correct } }));
  }, [currentQ]);

  const goNext = useCallback(async () => {
    if (currentIndex + 1 >= totalQuestions) {
      // Quiz done
      setQuizState('result');
      const score = Object.values(answers ?? {}).filter((a: any) => a?.correct).length;
      setSaving(true);
      try {
        await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studyUnitId: studyUnit?.id, score, total: totalQuestions }),
        });
      } catch {
        // Ignore save error
      } finally {
        setSaving(false);
      }
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelectedOption(null);
    setMcRevealed(false);
    setOpenAnswer('');
    setOpenRevealed(false);
  }, [currentIndex, totalQuestions, answers, studyUnit?.id]);

  const score = Object.values(answers ?? {}).filter((a: any) => a?.correct).length;
  const pct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  if (totalQuestions === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-12 space-y-4">
        <p className="text-muted-foreground">Keine Fragen vorhanden.</p>
        <Button onClick={() => router.push(`/study/${studyUnit?.id}`)}>Zurück zur Lerneinheit</Button>
      </div>
    );
  }

  if (quizState === 'result') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto space-y-6 py-8">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold">Quiz beendet!</h1>
          <div className="text-4xl font-bold">
            <span className={pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-yellow-600' : 'text-destructive'}>{score}/{totalQuestions}</span>
          </div>
          <Badge variant={pct >= 70 ? 'default' : 'secondary'} className="text-lg px-4 py-1">{pct}%</Badge>
          <p className="text-muted-foreground">
            {pct >= 90 ? 'Ausgezeichnet! 🌟' : pct >= 70 ? 'Gut gemacht! 👍' : pct >= 40 ? 'Weiter üben! 💪' : 'Nicht aufgeben! 🙌'}
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Button className="gap-2" onClick={() => { setCurrentIndex(0); setAnswers({}); setQuizState('quiz'); setSelectedOption(null); setMcRevealed(false); setOpenAnswer(''); setOpenRevealed(false); }}>
            <RotateCcw className="w-4 h-4" /> Nochmal versuchen
          </Button>
          <Button variant="secondary" className="gap-2" onClick={() => router.push(`/study/${studyUnit?.id}`)}>
            <ArrowLeft className="w-4 h-4" /> Zur Lerneinheit
          </Button>
          <Button variant="ghost" onClick={() => router.push('/dashboard')}>Zum Dashboard</Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="gap-1">
            {ICONS[studyUnit?.subject?.icon ?? ''] ?? '📚'} {studyUnit?.subject?.name ?? ''}
          </Badge>
          <span className="text-sm text-muted-foreground font-mono">{currentIndex + 1}/{totalQuestions}</span>
        </div>
        <Progress value={progressPct} className="h-2" />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={currentQ?.id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.2 }}>
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start gap-2">
                <Badge variant={currentQ?.type === 'OPEN' ? 'default' : 'secondary'} className="shrink-0">
                  {currentQ?.type === 'OPEN' ? 'Offen' : 'MC'}
                </Badge>
                <p className="font-medium text-base leading-relaxed">{currentQ?.questionText}</p>
              </div>

              {currentQ?.type === 'MULTIPLE_CHOICE' ? (
                <div className="space-y-2">
                  {((currentQ?.options as string[]) ?? []).map((option: string, idx: number) => {
                    const isCorrect = idx === (currentQ?.correctOption ?? -1);
                    const isSelected = selectedOption === idx;
                    let classes = 'w-full text-left p-3 rounded-lg border text-sm transition-all ';
                    if (mcRevealed) {
                      if (isCorrect) classes += 'border-green-500 bg-green-50 text-green-800 font-medium';
                      else if (isSelected && !isCorrect) classes += 'border-destructive bg-destructive/5 text-destructive';
                      else classes += 'border-border text-muted-foreground';
                    } else {
                      classes += 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer';
                    }
                    return (
                      <button key={idx} onClick={() => handleMcSelect(idx)} disabled={mcRevealed} className={classes}>
                        <span className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono shrink-0">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          {option}
                          {mcRevealed && isCorrect && <CheckCircle className="w-4 h-4 text-green-600 ml-auto shrink-0" />}
                          {mcRevealed && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-destructive ml-auto shrink-0" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Deine Antwort..."
                    value={openAnswer}
                    onChange={(e: any) => setOpenAnswer(e.target.value)}
                    rows={3}
                    disabled={openRevealed}
                  />
                  {!openRevealed ? (
                    <Button variant="secondary" className="w-full" onClick={() => setOpenRevealed(true)} disabled={!openAnswer.trim()}>
                      Musterantwort anzeigen
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Musterantwort:</p>
                        <p className="text-sm">{currentQ?.sampleAnswer}</p>
                      </div>
                      {!(currentQ?.id && answers?.[currentQ.id]) && (
                        <div className="space-y-2">
                          <p className="text-sm text-center text-muted-foreground">War deine Antwort richtig?</p>
                          <div className="flex gap-3">
                            <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700" onClick={() => handleOpenSelfGrade(true)}>
                              <ThumbsUp className="w-4 h-4" /> Richtig
                            </Button>
                            <Button variant="destructive" className="flex-1 gap-2" onClick={() => handleOpenSelfGrade(false)}>
                              <ThumbsDown className="w-4 h-4" /> Falsch
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Next button */}
      {(currentQ?.id && answers?.[currentQ.id]) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button className="w-full gap-2 h-11" onClick={goNext}>
            {currentIndex + 1 >= totalQuestions ? (
              <><Trophy className="w-4 h-4" /> Ergebnis anzeigen</>
            ) : (
              <><ArrowRight className="w-4 h-4" /> Nächste Frage</>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
