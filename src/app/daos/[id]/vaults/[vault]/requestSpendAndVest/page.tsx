'use client';

import { Suspense } from "react";
import SpendAndVestView from './components/SpendAndVestView';
import Loading from './loading';

export default function WithdrawAndTransferPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <SpendAndVestView />
      </Suspense>
    </>
  );
}
