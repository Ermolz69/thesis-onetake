import {
  centeredShell,
  contentContainer,
  contentShell,
  emptyStateText as recipeEmptyStateText,
  emptyStateTitle as recipeEmptyStateTitle,
  emptyStateWrapper as recipeEmptyStateWrapper,
  fieldInput,
  fieldInputError,
  fieldLabel,
  toolbar as recipeToolbar,
} from './recipes';

export const pageWrapper = centeredShell;

export const pageContainer = contentShell;

export { contentContainer };

export const cardClass =
  'w-full max-w-md rounded-2xl border border-border-soft bg-surface-card p-6 shadow-md backdrop-blur sm:p-8';

export const titleClass = 'text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl';

export const subtitleClass = 'mt-2 text-sm text-text-secondary';

export const labelClass = fieldLabel;

export const inputBase = `${fieldInput} auth-input`;

export const inputError = fieldInputError;

export const btnPrimary =
  'inline-flex h-button-md w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 font-semibold text-accent-foreground shadow-sm transition hover:bg-accent-hover focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60';

export const btnPrimaryInline =
  'inline-flex h-button-md items-center justify-center gap-2 rounded-xl bg-accent px-5 font-semibold text-accent-foreground shadow-sm transition hover:bg-accent-hover focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60';

export const btnSecondary =
  'inline-flex h-button-md w-full items-center justify-center gap-2 rounded-xl border border-border-soft bg-surface-elevated px-5 font-semibold text-text-primary shadow-xs transition hover:border-border-strong hover:bg-surface-muted focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60';

export const btnSecondaryInline =
  'inline-flex h-button-md items-center justify-center gap-2 rounded-xl border border-border-soft bg-surface-elevated px-5 font-semibold text-text-primary shadow-xs transition hover:border-border-strong hover:bg-surface-muted focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60';

export const linkClass =
  'rounded-lg text-text-secondary transition hover:text-text-primary focus:outline-none focus:ring-0';

export const tabsWrapper = 'mt-6 flex flex-wrap gap-2';

export const tabDefault =
  'h-10 rounded-xl border border-border-soft bg-surface-elevated px-4 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:bg-surface-muted hover:text-text-primary';

export const tabActive =
  'h-10 rounded-xl bg-surface-inverse px-4 text-sm font-semibold text-text-inverse shadow-sm';

export const emptyStateWrapper = recipeEmptyStateWrapper;

export const emptyStateTitle = recipeEmptyStateTitle;

export const emptyStateText = recipeEmptyStateText;

export const sortSelect =
  'h-input-md rounded-xl border border-border-soft bg-surface-elevated px-3 text-sm font-semibold text-text-primary shadow-xs focus:outline-none focus:ring-0';

export const toolbar = recipeToolbar;
