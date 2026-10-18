import { Fragment } from 'react';

/**
 * DOIs and URLs may wrap only after a "/", never inside a number ("10.5281/<wbr>zenodo.19847108").
 * No break opportunity between the two slashes of "https://". Pair with `[overflow-wrap:normal]`.
 */
export function BreakAtSlash({ text }: { text: string }) {
  const parts = text.split('/');
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {p}
          {i < parts.length - 1 && <>/{parts[i + 1] !== '' && <wbr />}</>}
        </Fragment>
      ))}
    </>
  );
}
