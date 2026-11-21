export const NEWSLETTER_DRAFT_KEY = 'briefly_newsletter_draft';

export function createEmptyDraft() {
  return {
    id: null,
    title: '',
    description: '',
    publish_time: '08:00',
    timezone: '',
    frequency: 'weekly',
    thumbnail_url: null,
    layout: [],
    template: 'editorial',
  };
}

export function readNewsletterDraft() {
  try {
    const saved = window.localStorage.getItem(NEWSLETTER_DRAFT_KEY);
    if (!saved) return createEmptyDraft();
    const parsed = JSON.parse(saved);
    return {
      ...createEmptyDraft(),
      ...parsed,
      layout: Array.isArray(parsed.layout) ? parsed.layout : [],
    };
  } catch {
    return createEmptyDraft();
  }
}

export function writeNewsletterDraft(draft) {
  window.localStorage.setItem(NEWSLETTER_DRAFT_KEY, JSON.stringify(draft));
}
