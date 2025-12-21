import { getDefaultNameVals } from './paletteLogic.js';

export function getCSS(colours, names = ['colour-name']) {


  // Use nameValue or fallback to "color"
  const baseName = names[0].trim().toLowerCase().replace(/\s+/g, '-');
  let css

  if (names.length !== colours.length) {
    names = getDefaultNameVals(colours.length);

    css = colours.map((c, i) =>
      `  --${baseName}-${names[i]}: ${c};`
    ).join('\n');
  } else {
    css = colours.map((c, i) => {
      // Check if name starts with -- or -, if not add --
      const name = names[i].toString();
      const formattedName = name.startsWith('--') ? name : `--${name}`;
      return `  ${formattedName}: ${c};`;
    }).join('\n');
  }

  return css;
}

export function convertCssVariables(cssVariables) {
  // 1. Split the input string into individual lines
  const lines = cssVariables.trim().split('\n');

  // 2. Define the flexible regular expression
  //    --([a-z]+)        -> Capture the color name (e.g., 'cobalt') after '--'
  //    (?:-([0-9]+))?    -> NON-CAPTURING GROUP (?:...) that is OPTIONAL (...)?
  //                        - This matches '-50' or '-100' and CAPTURES the number ([0-9]+)
  //    :\s* -> Match the colon and any following whitespace
  //    (#[a-fA-F0-9]+)   -> Capture the hex color code
  const regex = /--([a-z]+)(?:-([a-zA-Z0-9]+))?:\s*(#[a-fA-F0-9]+);?/i

  // 3. Process and map each line
  const convertedLines = lines.map(line => {
    const trimmedLine = line.trim();
    const match = trimmedLine.match(regex);

    if (match) {
      // match[1] is the color name (e.g., 'cobalt')
      // match[2] is the OPTIONAL shade number (e.g., '50' or undefined)
      // match[3] is the hex code (e.g., '#ebf6f9')
      const colorName = match[1];
      const shade = match[2];
      const hexCode = match[3];

      const namePart = shade ? `${colorName}/${shade}` : colorName;

      return `${namePart}, ${hexCode}`;
    }

    return null; // Ignore lines that don't match
  }).filter(line => line !== null);

  // 4. Join the converted lines back into a single string
  return convertedLines.join('\n');
}
