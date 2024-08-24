export type StyleHook = (
  node: HTMLElement,
  index: number,
  props: object
) => { [key: string]: string | number };

export type StyleDictionary = { [key: string]: string | number };
