/**
 * Convert a camel-cased string to a hyphenated string.
 * @param camel camel-cased string.
 * @returns hyphenated string.
 */
function camelToDash(camel: string): string {
  let dash = "";
  for (let i = 0; i < camel.length; i++) {
    let char = camel.charAt(i);
    if (char.toLowerCase() !== char) dash += "-";
    dash += char.toLowerCase();
  }
  return dash;
}

export default camelToDash;
