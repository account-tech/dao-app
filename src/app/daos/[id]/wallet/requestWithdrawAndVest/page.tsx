'use client';

import { Suspense } from "react";
import WithdrawAndVestView from './components/WithdrawAndVestView';
import Loading from './loading';

export default function WithdrawAndVestPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <WithdrawAndVestView />
      </Suspense>
    </>
  );
}
