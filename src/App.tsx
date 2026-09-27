import { Workspace } from './components/agent/Workspace';
import { ClassicView } from './components/classic/ClassicView';
import { ConsentProvider } from './components/consent/ConsentProvider';
import { CookieBanner } from './components/consent/CookieBanner';
import { ExitIntent } from './components/conversion/ExitIntent';
import { Footer } from './components/layout/Footer';
import { Topbar } from './components/layout/Topbar';
import type { Dict, Lang } from './i18n';
import { I18nProvider } from './i18n/context';
import { AppStateProvider, useAppState } from './lib/app-state';
import { ChecklistPage } from './pages/ChecklistPage';
import { LegalPage } from './pages/LegalPage';
import type { Page } from './routes';
import './styles/global.css';

export interface AppProps {
  lang: Lang;
  page: Page;
  dict: Dict;
}

export function App({ lang, page, dict }: AppProps) {
  return (
    <I18nProvider lang={lang} dict={dict}>
      <ConsentProvider>
        <AppStateProvider>
          <Topbar page={page} />
          <main id="main" tabIndex={-1}>
            <PageBody page={page} />
          </main>
          <Footer page={page} />
          <CookieBanner />
          {page === 'home' && <ExitIntent />}
        </AppStateProvider>
      </ConsentProvider>
    </I18nProvider>
  );
}

function PageBody({ page }: { page: Page }) {
  const { mode } = useAppState();
  switch (page) {
    case 'home':
      return (
        <>
          <Workspace hidden={mode !== 'chat'} />
          <ClassicView hidden={mode !== 'read'} />
        </>
      );
    case 'checklist':
      return <ChecklistPage />;
    default:
      return <LegalPage kind={page} />;
  }
}
