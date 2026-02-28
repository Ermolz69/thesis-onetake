import { useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RecordWizard } from '@/widgets/record-wizard';
import { routes } from '@/shared/config';
import {
  pageContainer,
  contentContainer,
  titleClass,
  subtitleClass,
} from '@/shared/ui/record-styles';
import { AuthContext } from '@/app/providers/auth';
import { Loader } from '@/shared/ui';

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
    <div className={pageContainer}>
      <div className={`${contentContainer} py-8`}>
        <h1 className={titleClass}>Recording Studio</h1>
        <p className={subtitleClass}>Record → Publish</p>
        <RecordWizard />
      </div>
    </div>
  );
};
