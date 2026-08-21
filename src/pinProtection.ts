export const PIN_PROTECTED_VIEWS = ["settings", "menu", "overview", "backup"] as const;

export type PinProtectedView = (typeof PIN_PROTECTED_VIEWS)[number];

export const requiresPin = (pinEnabled: boolean, view: string) => pinEnabled && (PIN_PROTECTED_VIEWS as readonly string[]).includes(view);
