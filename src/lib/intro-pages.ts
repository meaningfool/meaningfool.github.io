// Home and About, the pages that open with the intro and its topic map at the same place. Going from one to the other
// happens without a full page load, so the map is moved rather than drawn again (src/components/IntroRouter.astro).
// Layout gives these pages the router, and the router loads any other page in full.
export const INTRO_PAGES: readonly string[] = ['/', '/about/'];

export const isIntroPage = (pathname: string) => INTRO_PAGES.includes(pathname);
