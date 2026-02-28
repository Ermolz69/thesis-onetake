export {
  pageContainer,
  contentContainer,
  cardClass,
  btnPrimary,
  btnPrimaryInline,
  btnSecondary,
  btnSecondaryInline,
  tabsWrapper,
  tabDefault,
  tabActive,
  emptyStateWrapper,
  emptyStateTitle,
  emptyStateText,
  sortSelect,
  toolbar,
  inputBase,
} from './shared-styles';

export const cover =
  'relative h-40 sm:h-52 rounded-3xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-500/20 via-fuchsia-500/10 to-white border border-slate-200/60 overflow-hidden';

export const headerCard =
  'relative -mt-10 sm:-mt-12 rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-[0_12px_36px_-18px_rgba(15,23,42,0.35)] p-4 sm:p-6';

export const avatar =
  'h-20 w-20 sm:h-24 sm:w-24 rounded-2xl border-4 border-white bg-slate-100 object-cover shadow-sm';

export const profileName = 'text-xl sm:text-2xl font-semibold tracking-tight text-slate-900';

export const profileUsername = 'text-sm font-medium text-slate-500';

export const profileBio = 'mt-2 text-sm text-slate-600 leading-relaxed max-w-2xl';

export const statsGrid = 'mt-4 grid grid-cols-3 gap-2 sm:gap-3 max-w-md';

export const statItem = 'rounded-xl border border-slate-200/70 bg-white/60 px-3 py-2 text-center';

export const statValue = 'text-lg font-semibold text-slate-900';

export const statLabel = 'text-xs text-slate-500';

export const postsGrid = 'mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3';

export const postCardProfile =
  'group rounded-2xl border border-slate-200/70 bg-white shadow-sm transition hover:-translate-y-[2px] hover:shadow-md overflow-hidden';

export const postCardPreview = 'relative aspect-video bg-slate-100';

export const postCardBody = 'p-4';

export const aboutCard =
  'mt-4 rounded-2xl border border-slate-200/70 bg-white/80 backdrop-blur shadow-sm p-5 sm:p-6';
