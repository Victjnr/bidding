import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';

/* ═══════════════════════════════════════════════════
   Typed Redux Hooks
   ═══════════════════════════════════════════════════ */

/** Pre-typed useDispatch — use this instead of the plain `useDispatch` */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/** Pre-typed useSelector — use this instead of the plain `useSelector` */
export const useAppSelector = useSelector.withTypes<RootState>();
