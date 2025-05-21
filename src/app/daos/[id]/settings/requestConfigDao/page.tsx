import ConfigDaoView from './components/ConfigDaoView';
import { Suspense } from 'react';
import Loading from './loading';

export default function DependencyConfigPage() {
  return (
    <Suspense fallback={<Loading />}>
      <ConfigDaoView />
    </Suspense>
  );
}
