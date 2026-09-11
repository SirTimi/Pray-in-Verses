import { apiRequest } from './api';

export type JournalMood =
  | 'Grateful'
  | 'Joyful'
  | 'Peaceful'
  | 'Seeking'
  | 'Hopeful'
  | 'Reflective'
  | 'Blessed';

export type JournalEntry = {
  id: string;
  userId: string;
  title: string;
  body: string;
  mood: string | null;
  createdAt: string;
  updatedAt: string;
};

export const JOURNAL_MOODS: JournalMood[] = [
  'Grateful',
  'Joyful',
  'Peaceful',
  'Seeking',
  'Hopeful',
  'Reflective',
  'Blessed',
];

export async function listJournals(query = '') {
  const search = query.trim();
  const suffix = search ? `?q=${encodeURIComponent(search)}&limit=50` : '?limit=50';
  const response = await apiRequest<{
    data: JournalEntry[];
    nextCursor: string | null;
  }>(`/journals${suffix}`);

  return response.data ?? [];
}

export async function getJournal(id: string) {
  const response = await apiRequest<{ data: JournalEntry }>(`/journals/${id}`);
  return response.data;
}

export async function createJournal(payload: {
  title: string;
  body: string;
  mood?: string;
}) {
  const response = await apiRequest<{ data: JournalEntry }>('/journals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function updateJournal(
  id: string,
  payload: {
    title?: string;
    body?: string;
    mood?: string;
  },
) {
  const response = await apiRequest<{ data: JournalEntry }>(`/journals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function deleteJournal(id: string) {
  return apiRequest<{ ok: true }>(`/journals/${id}`, {
    method: 'DELETE',
  });
}
