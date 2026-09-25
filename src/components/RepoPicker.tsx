import { useEffect, useState } from 'react';
import type { RepoData } from '../data/types';
import { CHROME } from '../data/themes';
import { localStorageStore } from '../lib/cache';
import { createClient, fetchUserRepos } from '../lib/github';
import type { UserRepo } from '../lib/github';
import type { Selection } from '../lib/selection';
import { isShown, toggleDescribed, toggleRepo } from '../lib/selection';
import { MONO } from './ui';

interface Props {
  described: Record<string, RepoData>;
  selection: Selection;
  onChange: (next: Selection) => void;
  token: string;
}

type Listing =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; repos: UserRepo[] }
  | { status: 'error'; message: string };

/**
 * Choisir les dépôts de la barre : masquer un dépôt décrit, ajouter un dépôt de
 * son compte GitHub. Le panneau appartient à la barre d'application, commune à
 * tous les dépôts : il en prend les couleurs.
 */
export function RepoPicker({ described, selection, onChange, token }: Props) {
  const [open, setOpen] = useState(false);
  const [listing, setListing] = useState<Listing>({ status: 'idle' });

  const list = () => {
    setListing({ status: 'loading' });
    fetchUserRepos(createClient(token || null, localStorageStore(), true))
      .then((repos) => setListing({ status: 'ready', repos }))
      .catch((e: unknown) =>
        setListing({
          status: 'error',
          message: e instanceof Error ? e.message : 'Lecture impossible — réessayez.',
        }),
      );
  };

  // Le panneau se ferme à la touche Échap, comme toute fenêtre.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const row = (key: string, label: string, detail: string, checked: boolean, toggle: () => void) => (
    <label
      key={key}
      style={{
        display: 'grid',
        gridTemplateColumns: '18px minmax(0, 1fr)',
        gap: 10,
        alignItems: 'start',
        padding: '7px 0',
        cursor: 'pointer',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={toggle}
        style={{ marginTop: 2, accentColor: CHROME.ink }}
      />
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontFamily: MONO, fontSize: 12, color: CHROME.ink }}>{label}</span>
        {detail && (
          <span style={{ fontSize: 11.5, lineHeight: 1.4, color: CHROME.inkSoft }}>{detail}</span>
        )}
      </span>
    </label>
  );

  const heading = (text: string) => (
    <span
      style={{
        fontFamily: MONO,
        fontSize: 9.5,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: CHROME.inkSoft,
        marginTop: 6,
      }}
    >
      {text}
    </span>
  );

  const button = (text: string, onClick: () => void) => (
    <button
      onClick={onClick}
      style={{
        appearance: 'none',
        cursor: 'pointer',
        alignSelf: 'flex-start',
        fontFamily: MONO,
        fontSize: 10.5,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '7px 12px',
        borderRadius: 999,
        border: `1px solid ${CHROME.inkSoft}`,
        background: 'transparent',
        color: CHROME.ink,
      }}
    >
      {text}
    </button>
  );

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="choix-depots"
        title="Choisir les dépôts affichés"
        style={{
          appearance: 'none',
          cursor: 'pointer',
          border: 'none',
          background: 'transparent',
          color: CHROME.ink,
          padding: '12px 16px',
          fontFamily: MONO,
          fontSize: 12,
          flex: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        ＋ Dépôts
      </button>

      {open && (
        <div
          id="choix-depots"
          role="dialog"
          aria-label="Dépôts affichés"
          style={{
            position: 'fixed',
            top: 44,
            right: 12,
            zIndex: 20,
            boxSizing: 'border-box',
            width: 'min(380px, calc(100vw - 24px))',
            maxHeight: 'calc(100vh - 64px)',
            overflowY: 'auto',
            background: CHROME.bar,
            color: CHROME.ink,
            border: `1px solid ${CHROME.swatchTray}`,
            borderRadius: 12,
            padding: '14px 16px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13.5, fontWeight: 700 }}>Dépôts affichés</span>
            {button('Fermer', () => setOpen(false))}
          </div>

          {heading('Décrits dans Atlas')}
          {Object.keys(described).map((k) =>
            row(
              k,
              described[k].label,
              described[k].slug.split('·')[0].trim(),
              !selection.hidden.includes(k),
              () => onChange(toggleDescribed(selection, k)),
            ),
          )}

          {heading('Votre compte GitHub')}
          {!token && (
            <span style={{ fontSize: 12, lineHeight: 1.5, color: CHROME.inkSoft }}>
              Saisissez un jeton GitHub dans la vue « Dépôt réel » pour lister vos dépôts, privés
              compris.
            </span>
          )}
          {token && listing.status === 'idle' && button('Lister mes dépôts', list)}
          {listing.status === 'loading' && (
            <span style={{ fontSize: 12, color: CHROME.inkSoft }}>Lecture de vos dépôts…</span>
          )}
          {listing.status === 'error' && (
            <>
              <span style={{ fontSize: 12, lineHeight: 1.5, color: CHROME.inkSoft }}>
                {listing.message}
              </span>
              {token && button('Réessayer', list)}
            </>
          )}
          {listing.status === 'ready' &&
            listing.repos.map((r) =>
              row(
                `${r.owner}/${r.name}`,
                `${r.owner}/${r.name}`,
                [r.private ? 'privé' : 'public', r.description].filter(Boolean).join(' · '),
                isShown(described, selection, r),
                () => onChange(toggleRepo(described, selection, r)),
              ),
            )}
          {listing.status === 'ready' && listing.repos.length === 0 && (
            <span style={{ fontSize: 12, color: CHROME.inkSoft }}>
              Aucun dépôt visible avec ce jeton — donnez-lui accès à vos dépôts dans GitHub.
            </span>
          )}
        </div>
      )}
    </>
  );
}
