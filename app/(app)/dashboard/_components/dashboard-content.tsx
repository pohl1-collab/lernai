'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Camera, FolderOpen, Trophy, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SafeDate } from '@/components/safe-format';

const SUBJECT_ICONS: Record<string, string> = {
  book: '📚', globe: '🌍', calculator: '🧮', flask: '🧪', history: '🏛️', music: '🎵', art: '🎨', language: '🗣️',
};

interface DashboardProps {
  userName: string;
  subjects: any[];
  recentUnits: any[];
  quizResults: any[];
}

export default function DashboardContent({ userName, subjects, recentUnits, quizResults }: DashboardProps) {
  const totalUnits = (subjects ?? []).reduce((sum: number, s: any) => sum + (s?._count?.studyUnits ?? 0), 0);
  const totalQuizzes = (quizResults ?? []).length;
  const avgScore = totalQuizzes > 0
    ? Math.round((quizResults ?? []).reduce((sum: number, q: any) => sum + ((q?.score ?? 0) / Math.max(q?.total ?? 1, 1)) * 100, 0) / totalQuizzes)
    : 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-display font-bold tracking-tight">
          Hallo{userName ? `, ${userName}` : ''}! <span className="inline-block">👋</span>
        </h1>
        <p className="text-muted-foreground">Bereit zum Lernen? Hier ist dein Überblick.</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Fächer', value: (subjects ?? []).length, icon: FolderOpen, color: 'text-blue-500' },
          { label: 'Lerneinheiten', value: totalUnits, icon: BookOpen, color: 'text-green-500' },
          { label: 'Quizze', value: totalQuizzes, icon: Trophy, color: 'text-yellow-500' },
          { label: 'Ø Ergebnis', value: `${avgScore}%`, icon: TrendingUp, color: 'text-purple-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/upload">
          <Button className="gap-2 shadow-sm">
            <Camera className="w-4 h-4" /> Foto hochladen
          </Button>
        </Link>
        <Link href="/subjects">
          <Button variant="secondary" className="gap-2">
            <FolderOpen className="w-4 h-4" /> Fächer verwalten
          </Button>
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" /> Letzte Lerneinheiten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(recentUnits ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Noch keine Lerneinheiten. Lade ein Foto hoch!</p>
            ) : (
              (recentUnits ?? []).map((unit: any) => (
                <Link key={unit?.id} href={`/study/${unit?.id}`}>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg">{SUBJECT_ICONS[unit?.subject?.icon ?? ''] ?? '📚'}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{unit?.title ?? 'Lerneinheit'}</p>
                        <p className="text-xs text-muted-foreground">{unit?.subject?.name ?? ''}</p>
                      </div>
                    </div>
                    <SafeDate date={unit?.createdAt} options={{ dateStyle: 'short' }} className="text-xs text-muted-foreground shrink-0" />
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-muted-foreground" /> Letzte Quiz-Ergebnisse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(quizResults ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Noch keine Quizze absolviert.</p>
            ) : (
              (quizResults ?? []).slice(0, 5).map((result: any) => {
                const pct = Math.round(((result?.score ?? 0) / Math.max(result?.total ?? 1, 1)) * 100);
                return (
                  <div key={result?.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <Sparkles className="w-4 h-4 text-accent shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{result?.studyUnit?.subject?.name ?? 'Fach'}</p>
                        <p className="text-xs text-muted-foreground">{result?.score}/{result?.total} richtig</p>
                      </div>
                    </div>
                    <Badge variant={pct >= 70 ? 'default' : 'secondary'}>{pct}%</Badge>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
