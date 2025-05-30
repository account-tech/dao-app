import ConfigDepsView from './components/ConfigDepsView';
import { Suspense } from 'react';
import Loading from './loading';

export default function MultisigConfigPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ConfigDepsView />
    </Suspense>
  );
} 