import ToggleUnverifiedDepsView from './components/ToggleUnverifiedDepsView';
import { Suspense } from 'react';
import Loading from './loading';

export default function MultisigConfigPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ToggleUnverifiedDepsView />
    </Suspense>
  );
} 