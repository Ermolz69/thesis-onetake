import { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RecordWizard } from '@/widgets/record-wizard';
import { routes } from '@/shared/config';
import { AuthContext } from '@/app/providers/auth';
import { Loader } from '@/shared/ui';
import {
  recordContentContainer,
  recordPageShell,
  recordPageSubtitle,
  recordPageTitle,
} from './styles';

export const RecordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext);
  const hasAuth = auth?.hasAuth ?? false;
  const restoreAttempted = auth?.restoreAttempted ?? false;

  useEffect(() => {
    if (!restoreAttempted) return;
    if (!hasAuth) {
      const next = encodeURIComponent(location.pathname || routes.record);
      navigate(`${routes.auth.login}?next=${next}`, { replace: true });
    }
  }, [restoreAttempted, hasAuth, navigate, location.pathname]);

  if (!restoreAttempted) {
    return <Loader size="lg" centered />;
  }
  if (!hasAuth) {
    return null;
  }

  return (
    <div className={recordPageShell}>
      <div className={`${recordContentContainer} py-8`}>
        <h1 className={recordPageTitle}>Recording Studio</h1>
        <p className={recordPageSubtitle}>Record to publish</p>
        <RecordWizard />
      </div>
    </div>
  );
};
