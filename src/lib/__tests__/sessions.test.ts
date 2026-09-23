import { describe, expect, it } from 'vitest';
import {
  clamp,
  isToolEcho,
  parseSessionFile,
  parseSessionFiles,
  shortDate,
  textOf,
} from '../sessions';

const line = (o: unknown) => JSON.stringify(o);

const SESSION = [
  line({ type: 'summary', summary: 'Une session' }),
  line({
    type: 'user',
    sessionId: 'abc-123',
    cwd: '/home/moi/projet',
    timestamp: '2026-09-21T09:00:00Z',
    message: { role: 'user', content: 'Ajoute le cache des réponses.' },
  }),
  line({
    type: 'assistant',
    timestamp: '2026-09-21T09:00:30Z',
    message: {
      role: 'assistant',
      content: [
        { type: 'thinking', thinking: 'à ne pas montrer' },
        { type: 'tool_use', name: 'Write', input: { file_path: 'src/lib/cache.ts' } },
      ],
    },
  }),
  // le résultat d'outil revient sous le rôle user : ce n'est pas une demande
  line({
    type: 'user',
    timestamp: '2026-09-21T09:00:31Z',
    message: { role: 'user', content: [{ type: 'tool_result', content: 'ok' }] },
  }),
  line({
    type: 'assistant',
    timestamp: '2026-09-21T09:01:00Z',
    message: {
      role: 'assistant',
      content: [
        { type: 'tool_use', name: 'Bash', input: { command: 'npm test' } },
        { type: 'text', text: 'Cache écrit, 13 tests au vert.' },
      ],
    },
  }),
  line({
    type: 'user',
    timestamp: '2026-09-21T09:05:00Z',
    message: { role: 'user', content: 'Documente-le.' },
  }),
  line({
    type: 'assistant',
    timestamp: '2026-09-21T09:06:00Z',
    message: {
      role: 'assistant',
      content: [
        { type: 'tool_use', name: 'Edit', input: { file_path: 'README.md' } },
        { type: 'text', text: 'README mis à jour.' },
      ],
    },
  }),
].join('\n');

describe('textOf', () => {
  it('accepte un contenu en texte simple', () => {
    expect(textOf('bonjour')).toBe('bonjour');
  });

  it('ne garde que les blocs de texte', () => {
    expect(
      textOf([
        { type: 'thinking', thinking: 'secret' },
        { type: 'text', text: 'visible' },
        { type: 'tool_use', name: 'Bash' },
      ]),
    ).toBe('visible');
  });

  it('rend une chaîne vide sur un contenu inconnu', () => {
    expect(textOf(null)).toBe('');
    expect(textOf(42)).toBe('');
  });
});

describe('isToolEcho', () => {
  it('reconnaît un message qui n’est que du résultat d’outil', () => {
    expect(isToolEcho([{ type: 'tool_result', content: 'ok' }])).toBe(true);
  });

  it('ne se trompe pas sur une vraie demande', () => {
    expect(isToolEcho('fais ceci')).toBe(false);
    expect(isToolEcho([{ type: 'tool_result' }, { type: 'text', text: 'et aussi…' }])).toBe(false);
  });
});

describe('parseSessionFile', () => {
  const s = parseSessionFile('abc.jsonl', SESSION)!;

  it('apparie chaque demande à la réponse qui la suit', () => {
    expect(s.exchanges).toHaveLength(2);
    expect(s.exchanges[0].prompt).toBe('Ajoute le cache des réponses.');
    expect(s.exchanges[0].reply).toBe('Cache écrit, 13 tests au vert.');
    expect(s.exchanges[1].prompt).toBe('Documente-le.');
  });

  it('ne prend pas un résultat d’outil pour une demande', () => {
    expect(s.exchanges.map((e) => e.prompt)).not.toContain('ok');
  });

  it('relève les outils employés et les fichiers touchés', () => {
    expect(s.tools).toContainEqual(['Write', 1]);
    expect(s.files).toEqual(['src/lib/cache.ts', 'README.md']);
    expect(s.exchanges[0].tools).toEqual(['Bash']);
  });

  it('retient l’identifiant, le dossier et les bornes de temps', () => {
    expect(s.id).toBe('abc-123');
    expect(s.cwd).toBe('/home/moi/projet');
    expect(s.started).toBe('2026-09-21T09:00:00Z');
    expect(s.ended).toBe('2026-09-21T09:06:00Z');
  });

  it('compte les lignes illisibles sans s’arrêter', () => {
    const withJunk = 'pas du json\n' + SESSION + '\n{ tronqué';
    const p = parseSessionFile('x.jsonl', withJunk)!;
    expect(p.skipped).toBe(2);
    expect(p.exchanges).toHaveLength(2);
  });

  it('garde une demande restée sans réponse', () => {
    const orphan = [
      line({ type: 'user', message: { role: 'user', content: 'première' } }),
      line({ type: 'user', message: { role: 'user', content: 'seconde' } }),
    ].join('\n');
    const p = parseSessionFile('o.jsonl', orphan)!;
    expect(p.exchanges.map((e) => e.prompt)).toEqual(['première', 'seconde']);
    expect(p.exchanges[0].reply).toBe('');
  });

  it('se passe d’un identifiant en retombant sur le nom du fichier', () => {
    const p = parseSessionFile('sans-id.jsonl', line({
      type: 'user',
      message: { role: 'user', content: 'salut' },
    }))!;
    expect(p.id).toBe('sans-id.jsonl');
  });

  it('rend null quand il n’y a rien d’exploitable', () => {
    expect(parseSessionFile('vide.jsonl', '')).toBeNull();
    expect(parseSessionFile('bruit.jsonl', 'nawak\nencore')).toBeNull();
    expect(
      parseSessionFile('outils.jsonl', line({ type: 'assistant', message: { role: 'assistant', content: [] } })),
    ).toBeNull();
  });
});

describe('parseSessionFiles', () => {
  it('range les sessions de la plus ancienne à la plus récente', () => {
    const early = line({
      type: 'user',
      timestamp: '2026-01-01T00:00:00Z',
      message: { role: 'user', content: 'vieille' },
    });
    const late = line({
      type: 'user',
      timestamp: '2026-09-01T00:00:00Z',
      message: { role: 'user', content: 'récente' },
    });

    const { sessions, unreadable } = parseSessionFiles([
      { name: 'b.jsonl', text: late },
      { name: 'a.jsonl', text: early },
      { name: 'vide.jsonl', text: '' },
    ]);

    expect(sessions.map((s) => s.file)).toEqual(['a.jsonl', 'b.jsonl']);
    expect(unreadable).toEqual(['vide.jsonl']);
  });
});

describe('affichage', () => {
  it('formate une date, ou avoue ne pas en avoir', () => {
    expect(shortDate('2026-09-21T09:00:00Z')).toMatch(/21/);
    expect(shortDate('')).toBe('—');
    expect(shortDate('pas une date')).toBe('—');
  });

  it('coupe un texte long sur un espace', () => {
    expect(clamp('un texte assez long à couper ici', 20)).toBe('un texte assez long…');
    expect(clamp('court', 20)).toBe('court');
  });
});
