<script>
  import Swatch from '$lib/components/Swatch.svelte';
  let inputValue = $state('');
  let nameValue = $state('');

  let colourArray = $derived(colourParse2(inputValue));

  let cssValue = $derived(getCSS(colourArray));
  let figmaValue = $derived(convertCssVariables(cssValue));

  function makeValidColour(str) {
    let s = str.trim().replace(";","");
    // If it looks like a hex code without #, add it
    if (/^[0-9a-f]{3,4}$|^[0-9a-f]{6}$|^[0-9a-f]{8}$/i.test(s)) {
      s = '#' + s;
    }
    // Validate hex, rgb(a), hsl(a)
    if (
      /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s) ||
      /^rgba?\(\s*(\d{1,3}%?\s*,\s*){2}\d{1,3}%?(\s*,\s*(0|1|0?\.\d+))?\s*\)$/i.test(s) ||
      /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%(\s*,\s*(0|1|0?\.\d+))?\s*\)$/i.test(s)
    ) {
      return s;
    }
    // Named CSS colors
    const cssColors = [
      "black","silver","gray","white","maroon","red","purple","fuchsia","green","lime","olive","yellow","navy","blue","teal","aqua",
      "orange","aliceblue","antiquewhite","aquamarine","azure","beige","bisque","blanchedalmond","blueviolet","brown","burlywood",
      "cadetblue","chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson","cyan","darkblue","darkcyan","darkgoldenrod",
      "darkgray","darkgreen","darkgrey","darkkhaki","darkmagenta","darkolivegreen","darkorange","darkorchid","darkred","darksalmon",
      "darkseagreen","darkslateblue","darkslategray","darkslategrey","darkturquoise","darkviolet","deeppink","deepskyblue","dimgray",
      "dimgrey","dodgerblue","firebrick","floralwhite","forestgreen","gainsboro","ghostwhite","gold","goldenrod","greenyellow","grey",
      "honeydew","hotpink","indianred","indigo","ivory","khaki","lavender","lavenderblush","lawngreen","lemonchiffon","lightblue",
      "lightcoral","lightcyan","lightgoldenrodyellow","lightgray","lightgreen","lightgrey","lightpink","lightsalmon","lightseagreen",
      "lightskyblue","lightslategray","lightslategrey","lightsteelblue","lightyellow","limegreen","linen","magenta","mediumaquamarine",
      "mediumblue","mediumorchid","mediumpurple","mediumseagreen","mediumslateblue","mediumspringgreen","mediumturquoise","mediumvioletred",
      "midnightblue","mintcream","mistyrose","moccasin","navajowhite","oldlace","olivedrab","orangered","orchid","palegoldenrod",
      "palegreen","paleturquoise","palevioletred","papayawhip","peachpuff","peru","pink","plum","powderblue","rosybrown","royalblue",
      "saddlebrown","salmon","sandybrown","seagreen","seashell","sienna","skyblue","slateblue","slategray","slategrey","snow","springgreen",
      "steelblue","tan","thistle","tomato","turquoise","violet","wheat","whitesmoke","yellowgreen","rebeccapurple"
    ];
    if (cssColors.includes(s.toLowerCase())) return s;
    return "black";
  }


  function colourParse(str) {
    return str
    .split(',')
    .map(s => makeValidColour(s))
  }

  function colourParse2(str) {
  // Split on commas or newlines
  const parts = str.split(/[\n,]+/).map(s => s.trim()).filter(Boolean);
    // Step naming convention (same as copyCSS)
  let steps = [100, 200, 300, 400, 500, 600, 700, 800, 900];
  if (parts.length === 10) {
    steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
  } else if (parts.length === 11) {
    steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  } else if (parts.length === 12) {
    steps = [20, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  } else {
    steps = Array.from({length: parts.length}, (_, i) => (i+1)*100);
  }
  return parts.map((s, i) => {
    const match = s.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      // property: value
      return {
        name: match[1].trim().replace(/^['"]+|['"]+$/g, ''),
        value: makeValidColour(match[2].replace(/^['"]+|['"]+$/g, ''))
      };
    } else {
      // just a value, assign name as 100, 200, ...
      const obj = {
        name: steps[i],
        value: makeValidColour(s)
      };
      return obj;
    }
  });
}

  let svgRef;

    async function copySVG() {
    if (!svgRef) return;
    // Serialize the SVG node to a string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef);

    // Copy to clipboard as text
    try {
      await navigator.clipboard.writeText(svgString);
      // alert('SVG copied to clipboard!');
    } catch (e) {
      alert('Failed to copy SVG');
    }
  }

  function getCSS(colourArray) {
    // Determine the steps for names
    let steps = [100, 200, 300, 400, 500, 600, 700, 800, 900];
    if (colourArray.length === 10) {
      steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
    } else if (colourArray.length === 11) {
      steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    } else if (colourArray.length === 12) {
      steps = [20, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
    }

    // Use nameValue or fallback to "color"
    const baseName = nameValue.trim() ? nameValue.trim().toLowerCase().replace(/\s+/g, '-') : 'color';

    // Build CSS string
    const css = colourArray.map((c, i) =>
      `  --${baseName}-${steps[i]}: ${c.value};`
    ).join('\n');

    return css;
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  function reverseColours() {
    // Split on commas or newlines, trim, filter out empty, reverse, and join with commas
    const reversed = inputValue
      .split(/[\n,]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .reverse()
      .join(', ');
    inputValue = reversed;
  }


  function convertCssVariables(cssVariables) {
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

</script>

<h1>Colour</h1>


<textarea
  type="text"
  bind:value={inputValue}
  placeholder="Enter a colours separated by commas"
  class="big-input"
></textarea>

<label for="name-input">Name</label>
<input
  id="name-input"
  type="text"
  bind:value={nameValue}
  placeholder="Enter a name..."
  style="margin-bottom: 1em; font-size: 1.2em; padding: 0.3em 0.8em; border-radius: 6px; display: block;"
/>



<textarea
  type="text"
  bind:value={figmaValue}
  placeholder="Figma export"
  class="big-input"
/>

<br>
<button on:click={reverseColours} style="margin-bottom:1em;">Reverse Colours</button>
<button on:click={copySVG} style="margin-bottom:1em;">Copy SVG to Clipboard</button>
<button on:click={copyToClipboard(cssValue)} style="margin-bottom:1em;">Copy CSS to Clipboard</button>
<button on:click={copyToClipboard(figmaValue)} style="margin-bottom:1em;">Copy for Figma</button>
<br>



<svg bind:this={svgRef} width="1200px" height="900px" viewBox="0 0 900 900" xmlns="http://www.w3.org/2000/svg">
  <!-- <Swatch colour="#ff0000" />
  <Swatch colour="#00ff00" x="100" />
  <Swatch colour="#0000ff" x="200" /> -->

  {#each colourArray as colour, i}
    <Swatch colour={colour.value} name={colour.name} x={i*90}   />
  {/each}
</svg>


<style>
  .big-input {
    width: 400px;
    min-height: 50px;
    border-radius: 6px;
    margin-bottom: 1em;
    resize: vertical;
  }
</style>