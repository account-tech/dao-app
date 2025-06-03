import ConfigDepsView from './components/ConfigDepsView';
import { Suspense } from 'react';
import Loading from './loading';

export default function ConfigDepsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ConfigDepsView />
    </Suspense>
  );
} 