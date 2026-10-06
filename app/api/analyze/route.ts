export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 });

  try {
    const body = await request.json();
    const { subjectId, imageBase64, contentType, cloud_storage_path, isPublic } = body ?? {};
    if (!subjectId || !imageBase64) {
      return NextResponse.json({ error: 'subjectId und imageBase64 erforderlich' }, { status: 400 });
    }

    // Verify subject belongs to user
    const subject = await prisma.subject.findFirst({ where: { id: subjectId, userId: session.user.id } });
    if (!subject) return NextResponse.json({ error: 'Fach nicht gefunden' }, { status: 404 });

    const apiKey = process.env.ABACUSAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API-Key nicht konfiguriert' }, { status: 500 });

    // Call LLM with streaming
    const llmResponse = await fetch('https://routellm.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'route-llm',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${contentType ?? 'image/jpeg'};base64,${imageBase64}` },
              },
              {
                type: 'text',
                text: `Analysiere dieses Bild einer Schulbuchseite / eines Hefts zum Fach "${subject.name}". Antworte AUF DEUTSCH. Erstelle:

1. Einen kurzen Titel für diese Lerneinheit (max 50 Zeichen)
2. Eine Zusammenfassung der wichtigsten Punkte als übersichtliche Liste (5-8 Punkte)
3. 5 offene Fragen zum Thema mit ausführlichen Musterantworten
4. 5 Multiple-Choice-Fragen mit je 4 Antwortmöglichkeiten (eine ist richtig)

Antwort als JSON:
{
  "title": "Kurzer Titel",
  "summary": "- Punkt 1\n- Punkt 2\n- Punkt 3...",
  "openQuestions": [
    { "question": "...", "sampleAnswer": "..." }
  ],
  "mcQuestions": [
    { "question": "...", "options": ["A", "B", "C", "D"], "correctOption": 0 }
  ]
}

Antworte NUR mit dem JSON. Kein Markdown, keine Code-Blöcke.`,
              },
            ],
          },
        ],
        stream: true,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      }),
    });

    if (!llmResponse.ok) {
      const errText = await llmResponse.text().catch(() => 'Unbekannter Fehler');
      console.error('LLM API error:', llmResponse.status, errText);
      return NextResponse.json({ error: `KI-Analyse fehlgeschlagen (${llmResponse.status})` }, { status: 502 });
    }

    // Stream and buffer the response
    const reader = llmResponse.body?.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let partialRead = '';

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          if (!reader) throw new Error('No reader');
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            partialRead += decoder.decode(value, { stream: true });
            const lines = partialRead.split('\n');
            partialRead = lines.pop() ?? '';
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Parse the buffered JSON and save to DB
                  try {
                    const parsed = JSON.parse(buffer);
                    const studyUnit = await prisma.studyUnit.create({
                      data: {
                        title: parsed?.title ?? 'Lerneinheit',
                        subjectId,
                        userId: session.user.id,
                        imageCloudPath: cloud_storage_path ?? null,
                        imageIsPublic: isPublic ?? false,
                        summary: parsed?.summary ?? '',
                        questions: {
                          create: [
                            ...(parsed?.openQuestions ?? []).map((q: any) => ({
                              type: 'OPEN' as const,
                              questionText: q?.question ?? '',
                              sampleAnswer: q?.sampleAnswer ?? '',
                            })),
                            ...(parsed?.mcQuestions ?? []).map((q: any) => ({
                              type: 'MULTIPLE_CHOICE' as const,
                              questionText: q?.question ?? '',
                              options: q?.options ?? [],
                              correctOption: q?.correctOption ?? 0,
                            })),
                          ],
                        },
                      },
                    });
                    const finalData = JSON.stringify({ status: 'completed', studyUnitId: studyUnit.id, result: parsed });
                    controller.enqueue(encoder.encode(`data: ${finalData}\n\n`));
                  } catch (parseError: any) {
                    console.error('Parse error:', parseError, 'Buffer:', buffer.slice(0, 200));
                    const errData = JSON.stringify({ status: 'error', message: 'KI-Antwort konnte nicht verarbeitet werden' });
                    controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
                  }
                  return;
                }
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed?.choices?.[0]?.delta?.content ?? '';
                  buffer += content;
                  const progressData = JSON.stringify({ status: 'processing', message: 'KI analysiert...' });
                  controller.enqueue(encoder.encode(`data: ${progressData}\n\n`));
                } catch {
                  // skip
                }
              }
            }
          }
        } catch (err: any) {
          console.error('Stream error:', err);
          const errData = JSON.stringify({ status: 'error', message: 'Verbindung zur KI unterbrochen' });
          controller.enqueue(encoder.encode(`data: ${errData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Analyse fehlgeschlagen' }, { status: 500 });
  }
}
