import CreateDaoView from './components/createDaoView';
import { Suspense } from 'react';
import Loading from './loading';


export default function CreateDaoPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CreateDaoView />
    </Suspense>
  );
}