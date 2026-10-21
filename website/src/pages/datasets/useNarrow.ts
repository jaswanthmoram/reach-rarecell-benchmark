import { useMedia } from '../../ui/useMedia';

const NARROW = '(max-width: 639px)';
/** True at the phone layout (below 640 px). */
export const useNarrow = () => useMedia(NARROW);
