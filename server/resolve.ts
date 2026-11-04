import type { ResolveHook } from 'node:module';

/** Ergänzt `.ts` bei relativen Importen ohne Endung: `src/` importiert so, und der Server nutzt Teile davon. */
export const resolve: ResolveHook = (specifier, context, nextResolve) => {
  const relative = specifier.startsWith('./') || specifier.startsWith('../');
  const hasExtension = /\.[a-z]+$/i.test(specifier);
  return nextResolve(relative && !hasExtension ? `${specifier}.ts` : specifier, context);
};
