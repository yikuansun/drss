export type StyleHook = (
  node: HTMLElement,
  index: number,
  props: object
) => { [key: string]: string };

export type StyleDictionary = { [key: string]: string };
