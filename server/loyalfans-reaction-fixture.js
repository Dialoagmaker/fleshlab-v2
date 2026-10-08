export const TARGET_UID = '0Qkybb8-2B8wc9XznSwOkJbvq8Ikn3xYgOheGGEnVczDg';
export const ACTOR_UID = 'lvDZ6Np0XdLpb3bTF9zD9dN5pKWL5ndCLJnpf1eY9JI';
export const CAPTURED_LIKE_AT = '2026-10-06T12:00:00.000Z';

export function capturedStyleNotification(overrides = {}) {
  return {
    id: 'notification-test-001',
    type: 'reaction',
    group: 'reactions',
    created_at: CAPTURED_LIKE_AT,
    object: {
      reaction: 'like',
      parent: { uid: TARGET_UID },
      user: { uid: ACTOR_UID }
    },
    top_parent: { uid: TARGET_UID },
    from_user: { uid: ACTOR_UID },
    ...overrides
  };
}
