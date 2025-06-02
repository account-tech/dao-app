'use client';

import { Suspense } from "react";
import SpendAndAirdropView from './components/SpendAndAirdropView';
import Loading from './loading';

export default function SpendAndAirdropPage() {
  return (
    <>
      <Suspense fallback={<Loading />}>
        <SpendAndAirdropView />
      </Suspense>
    </>
  );
}
