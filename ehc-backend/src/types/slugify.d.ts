declare module 'slugify' {
  interface Options {
    replacement?: string;
    lower?: boolean;
    strict?: boolean;
    locale?: string;
    trim?: boolean;
  }

  function slugify(value: string, options?: Options): string;

  export = slugify;
}
