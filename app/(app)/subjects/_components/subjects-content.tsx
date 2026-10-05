'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, FolderOpen, BookOpen, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const ICONS: { value: string; label: string; emoji: string }[] = [
  { value: 'book', label: 'Buch', emoji: '📚' },
  { value: 'globe', label: 'Erdkunde', emoji: '🌍' },
  { value: 'calculator', label: 'Mathe', emoji: '🧮' },
  { value: 'flask', label: 'Chemie', emoji: '🧪' },
  { value: 'history', label: 'Geschichte', emoji: '🏛️' },
  { value: 'music', label: 'Musik', emoji: '🎵' },
  { value: 'art', label: 'Kunst', emoji: '🎨' },
  { value: 'language', label: 'Sprache', emoji: '🗣️' },
];

export default function SubjectsContent({ subjects: initialSubjects }: { subjects: any[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState('book');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Bitte gib einen Namen ein'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), color, icon }),
      });
      if (!res.ok) throw new Error();
      toast.success('Fach erstellt!');
      setDialogOpen(false);
      setName('');
      router.refresh();
    } catch {
      toast.error('Fach konnte nicht erstellt werden');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Fach und alle zugehörigen Lerneinheiten löschen?')) return;
    try {
      await fetch(`/api/subjects/${id}`, { method: 'DELETE' });
      toast.success('Fach gelöscht');
      router.refresh();
    } catch {
      toast.error('Löschen fehlgeschlagen');
    }
  };

  const getEmoji = (iconVal: string) => ICONS.find((i) => i.value === iconVal)?.emoji ?? '📚';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight">Meine Fächer</h1>
          <p className="text-muted-foreground text-sm">Verwalte deine Lernfächer</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Neues Fach</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Neues Fach erstellen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="z.B. Erdkunde, Mathe..." value={name} onChange={(e: any) => setName(e.target.value)} autoFocus />
              </div>
              <div className="space-y-2">
                <Label>Symbol</Label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((ic) => (
                    <button key={ic.value} onClick={() => setIcon(ic.value)} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${icon === ic.value ? 'ring-2 ring-primary bg-primary/10 scale-110' : 'bg-muted hover:bg-muted/80'}`}>
                      {ic.emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Farbe</Label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setColor(c)} className={`w-8 h-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} disabled={creating} className="w-full">
                {creating ? 'Erstelle...' : 'Fach erstellen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(initialSubjects ?? []).length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center space-y-3">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="font-medium">Noch keine Fächer</h3>
            <p className="text-sm text-muted-foreground">Erstelle dein erstes Fach, um loszulegen!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {(initialSubjects ?? []).map((subject: any, i: number) => (
              <motion.div key={subject?.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: i * 0.05 }}>
                <Card className="group hover:shadow-md transition-all relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: subject?.color ?? '#3b82f6' }} />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getEmoji(subject?.icon ?? 'book')}</span>
                        <div>
                          <h3 className="font-semibold">{subject?.name}</h3>
                          <p className="text-xs text-muted-foreground">{subject?._count?.studyUnits ?? 0} Lerneinheiten</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive" onClick={() => handleDelete(subject?.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {(subject?.studyUnits ?? []).length > 0 && (
                      <div className="space-y-1 mb-3">
                        {(subject?.studyUnits ?? []).map((u: any) => (
                          <Link key={u?.id} href={`/study/${u?.id}`} className="block text-xs text-muted-foreground hover:text-foreground truncate">
                            • {u?.title ?? 'Lerneinheit'}
                          </Link>
                        ))}
                      </div>
                    )}
                    <Link href={`/upload?subjectId=${subject?.id}`}>
                      <Button size="sm" variant="secondary" className="w-full gap-2">
                        <Sparkles className="w-3.5 h-3.5" /> Foto hochladen
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
