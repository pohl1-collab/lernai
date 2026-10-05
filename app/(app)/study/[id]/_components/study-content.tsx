'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, HelpCircle, Trophy, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SafeDate } from '@/components/safe-format';

const ICONS: Record<string, string> = { book: '📚', globe: '🌍', calculator: '🧮', flask: '🧪', history: '🏛️', music: '🎵', art: '🎨', language: '🗣️' };

export default function StudyContent({ studyUnit }: { studyUnit: any }) {
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const openQuestions = (studyUnit?.questions ?? []).filter((q: any) => q?.type === 'OPEN');
  const mcQuestions = (studyUnit?.questions ?? []).filter((q: any) => q?.type === 'MULTIPLE_CHOICE');

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="gap-2 -ml-2">
            <ArrowLeft className="w-4 h-4" /> Zurück
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{ICONS[studyUnit?.subject?.icon ?? ''] ?? '📚'}</span>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight">{studyUnit?.title ?? 'Lerneinheit'}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{studyUnit?.subject?.name ?? ''}</span>
              <span>•</span>
              <SafeDate date={studyUnit?.createdAt} options={{ dateStyle: 'medium' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quiz button */}
      <Link href={`/quiz/${studyUnit?.id}`}>
        <Button className="w-full gap-2 h-12 text-base shadow-sm">
          <Sparkles className="w-5 h-5" /> Quiz starten
        </Button>
      </Link>

      <Tabs defaultValue="summary" className="space-y-4">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="summary" className="gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Zusammenfassung</TabsTrigger>
          <TabsTrigger value="open" className="gap-1.5"><HelpCircle className="w-3.5 h-3.5" /> Offene Fragen</TabsTrigger>
          <TabsTrigger value="results" className="gap-1.5"><Trophy className="w-3.5 h-3.5" /> Ergebnisse</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader><CardTitle className="text-base">Zusammenfassung</CardTitle></CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                {(studyUnit?.summary ?? '').split('\n').map((line: string, i: number) => (
                  <p key={i} className={`${line?.startsWith('- ') ? 'pl-4 before:content-["\u2022"] before:mr-2 before:text-primary' : ''}`}>
                    {line?.startsWith('- ') ? line.slice(2) : line}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="open">
          <div className="space-y-3">
            {openQuestions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Keine offenen Fragen vorhanden.</p>
            ) : (
              openQuestions.map((q: any, i: number) => (
                <motion.div key={q?.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => setExpandedQ(expandedQ === q?.id ? null : q?.id)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <Badge variant="secondary" className="shrink-0 mt-0.5">{i + 1}</Badge>
                          <p className="text-sm font-medium">{q?.questionText}</p>
                        </div>
                        {expandedQ === q?.id ? <ChevronUp className="w-4 h-4 shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 shrink-0 mt-1" />}
                      </div>
                      {expandedQ === q?.id && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-3 pt-3 border-t">
                          <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Musterantwort:</span> {q?.sampleAnswer}</p>
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader><CardTitle className="text-base">Letzte Quiz-Ergebnisse</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(studyUnit?.quizResults ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Noch kein Quiz absolviert.</p>
              ) : (
                (studyUnit?.quizResults ?? []).map((r: any) => {
                  const pct = Math.round(((r?.score ?? 0) / Math.max(r?.total ?? 1, 1)) * 100);
                  return (
                    <div key={r?.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{r?.score}/{r?.total} richtig</p>
                        <SafeDate date={r?.createdAt} options={{ dateStyle: 'short', timeStyle: 'short' }} className="text-xs text-muted-foreground" />
                      </div>
                      <Badge variant={pct >= 70 ? 'default' : 'secondary'}>{pct}%</Badge>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
