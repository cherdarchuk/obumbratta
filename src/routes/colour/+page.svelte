<script>
  import chroma from 'chroma-js';
  import { getTailwindColors } from "uicolors-generator";
  import Swatch from '$lib/components/Swatch.svelte';
  import StepChart from '$lib/components/StepChart.svelte';
	import { get } from 'svelte/store';
	
  const colourSpaces = ['lab', 'lab-bezier', 'lch','hsl', 'hsv', 'rgb', 'oklab', 'oklch'];
  
  let inputValue = $state('purple');
  let nameValue = $state('');
  let numColours = $state(11);
  // let startExtend = $state(0);
  let colorSpace = $state('lch');
  let correctLightness = $state(false);
  let blackBackground = $state(false);

  let parsedNames = $derived(nameParse(inputValue));
  let parsedColours = $derived(colourParse(inputValue));
  let transformedColours = $derived(interpolateColors(parsedColours));
  let outputNames = $derived(getDefaultNameVals(transformedColours.length));
  let lightnessArray = $derived(transformedColours.map(c => chroma(c).lab()[0]));


  let inputCssValue = $derived(getCSS(parsedColours, parsedNames));
  let outputCssValue = $derived(getCSS(transformedColours));

  let inputFigmaValue = $derived(convertCssVariables(inputCssValue)); 
  let outputFigmaValue = $derived(convertCssVariables(outputCssValue)); 
  let svgRef;



  function interpolateColors(colours) {
    let colourList = [...colours];
    let scale;
    let domainVals = [0,1];

    if (colours.length < 1) {
      return colourList;
    }
    else if (colours.length === 1) {
      const originalColour = colours[0];
      const obj = getTailwindColors(colours[0], {asHex: true});
      const tailwindColors = Object.values(obj);
      const originalIndex = tailwindColors.findIndex(c => c === originalColour);

      if (numColours <= 9 && originalIndex !== 0 && originalIndex !== 10) {
        colourList = [tailwindColors[1],colourList[0],tailwindColors[9]];
        domainVals = [0, (originalIndex-1)/9, 1];
      }
      else {
        colourList = [tailwindColors[0],colourList[0],tailwindColors[10]];
        domainVals = [0, originalIndex/10, 1];
      }
      
    }

    scale = colorSpace === 'lab-bezier'
      ? chroma.bezier(colourList).scale()
      : chroma.scale(colourList).mode(colorSpace);

    return scale.correctLightness(correctLightness).domain(domainVals).colors(numColours);
  }


  
  function getDefaultNameVals(length) {
    const stepMap = {
      9: [100, 200, 300, 400, 500, 600, 700, 800, 900],
      10: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
      11: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
      12: [20, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
    };
    return stepMap[length] || Array.from({length: length}, (_, i) => (i+1)*100);
  }

  function colourParse(str) {
    // Split on commas or newlines
    if (!str || !str.trim()) return { colours: [], names: [] };
    const parts = str.split(/[;,]+/).map(s => s.trim()).filter(Boolean);
    
    const colours = [];
    
    parts.forEach((s, i) => {
      const match = s.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        const st = match[2].replace(/^['"]+|['"]+$/g, '');
        colours.push(chroma.valid(st) ? chroma(st).hex() : '#000000');
      } else {
        colours.push(chroma.valid(s) ? chroma(s).hex() : '#000000');
      }
    });
    
    return colours;
  }

  
  function nameParse(str) {
    // Split on commas or newlines
    if (!str || !str.trim()) return [];
    const parts = str.split(/[;,]+/).map(s => s.trim()).filter(Boolean);
    let names = [];
    
    parts.forEach((s, i) => {
      const match = s.match(/^([^:]+):\s*(.+)$/);
      if (match) {
        // property: value format
        const st = match[2].replace(/^['"]+|['"]+$/g, '');
        names.push(match[1].trim().replace(/^['"]+|['"]+$/g, ''));
      }
    });
    
    return names;
  }

  function getSVG() {
    if (!svgRef) return;
    // Serialize the SVG node to a string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef);
    return svgString;
  }
  

  function getCSS(colours, names = []) {

    // Use nameValue or fallback to "color"
    const baseName = nameValue.trim() ? nameValue.trim().toLowerCase().replace(/\s+/g, '-') : 'color';
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

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  function reverseColours() {
    // Split on commas or newlines, trim, filter out empty, reverse, and join with commas
    const reversed = inputValue
      .split(/[;,]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .reverse()
      .join(', ');
    inputValue = reversed;
  }

  function spaceToComma() {
    const commas = inputValue.replace(/\s+/g, ',');
    inputValue = commas;
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

<div class="container" class:black-background={blackBackground}>

  <h2>Colour</h2>

  <div class="row">  
    <input
      type="text"
      bind:value={inputValue}
      placeholder="Enter colours separated by commas"
      class="big-input"
    />
    <button onclick={reverseColours} style="width: 100px;">Reverse</button>
    <button onclick={spaceToComma} style="width: 100px;">" " → ","</button>
  </div>




  <svg width="1200px" height="40px" viewBox="0 0 1200 40" xmlns="http://www.w3.org/2000/svg">
    {#each parsedColours as colour, i}
      <Swatch {colour} name={''} x={i*90} short={true}   />
    {/each}
  </svg>


  <div class="row">  
    <!-- <div>
      <label for="num-colours">Extend Start</label>
      <input
        id="start-extend"
        type="number"
        bind:value={startExtend}
        min="0"
        max="10"
        style="width: 100px;"
      />
    </div> -->

    <div>
      <label for="num-colours">No. Colours</label>
      <input
        id="num-colours"
        type="number"
        bind:value={numColours}
        min="2"
        max="20"
        style="width: 100px;"
      />  
    </div>

    <div>
    <label for="color-space">Color Space</label>
    <select id="color-space" bind:value={colorSpace}>
      {#each colourSpaces as space}
        <option value={space}>{space.toUpperCase()}</option>
      {/each}
    </select>
    </div>

    <div>
      <label for="correct-lightness">Correct Lightness</label>
      <input class="big-checkbox"
        id="correct-lightness"
        type="checkbox"
        bind:checked={correctLightness}
      />
    </div> 

    <div>
      <label for="black-background">Black Background</label>
      <input class="big-checkbox"
        id="black-background"
        type="checkbox"
        bind:checked={blackBackground}
      />
    </div>  

    <button onclick={() => copyToClipboard(inputCssValue)}>Copy Input CSS to Clipboard</button>
    <button onclick={() => copyToClipboard(inputFigmaValue)}>Copy Input Figma to Clipboard</button>
  </div>


  <h2>Transformed</h2>
  <svg bind:this={svgRef} width="1000px" height="100px" viewBox="0 0 1000 100" xmlns="http://www.w3.org/2000/svg">
    {#each transformedColours as colour, i}
      <Swatch {colour} name={outputNames[i]} x={i*Math.min(90, 1000/numColours)} width={Math.min(84,1000/numColours-6)} />
    {/each}
  </svg>

  <StepChart values={lightnessArray} size={Math.min(1000,90*numColours)} />

  <div class="row">
    <button onclick={() => copyToClipboard(getSVG())}>Copy SVG to Clipboard</button>
    <div>
      <label for="name-input">CSS Variable Name</label>
      <input
        id="name-input"
        type="text"
        bind:value={nameValue}
        placeholder="Enter a name..."
      />
    </div>
    <button onclick={() => copyToClipboard(transformedColours.toString())}>Copy array to Clipboard</button>
    <button onclick={() => copyToClipboard(outputCssValue)}>Copy CSS to Clipboard</button>
    <button onclick={() => copyToClipboard(outputFigmaValue)}>Copy for Figma</button>
  </div>

</div>


<style>

  .row {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .big-input {
    width: 100%;
    min-height: 50px;
    border-radius: 6px;
    /* resize: vertical; */
  }
  .big-checkbox {
    width: 20px;
    height: 20px;
  }

  input {
    display: block;
    font-size: 16px;
    min-height: 50px;
    border-radius: 6px;
  }

  label {
    display: block;
  }

  select {
    min-height: 50px;
    border-radius: 6px;
  }

  button {
    padding: 10px;
    border: 1px solid grey;
    border-radius: 6px;
  }

  .container {
    max-width: 1600px;
    margin: 70px auto 40px;
    padding: 0 40px;
    background-color: white;
  }
  .black-background {
    background-color: black;
  }

  .mq-mobile.container {
    padding: 0 24px;
  }

  h1 {
    text-align: center;
    font-size: 3.75rem;
    max-width: 800px;
    margin: auto;
    letter-spacing: -0.05em;
  }

  h2, .obumbratta {
    text-align: center;
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    display: table;
    margin: auto;
    padding: 8px 6px 4px 10px;
    border-radius: 3px ;
    background-color: var(--back-colour);
  }

  h2 {
    position: sticky;
    top: 70px;
    margin-bottom: 1rem;
    width: 100%;
  }

  h2.mq-mobile{
    position: relative;
    top: 0;
  }


  h3 {
    text-align: center;
    font-size: 1rem;
    color: var(--grey-600);
  }

  .break {
    margin: 2.5rem auto;
    width: 2rem;
    border-bottom: 1px solid var(--brown-400);
  }


  /* Scrolly formatting */

    .step {
    max-width: 500px;
    margin: auto;
    margin-bottom: 3rem;
  }



  /* Contact Info */
  .contacts {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    margin-bottom: 5rem;
  }

  .contact-cta {
    width: 180px;
    font-family: var(--sans);
    font-size: 0.875rem;
    line-height: 1.4rem;

  }
  .contact-points {
    width: 180px;
  }
  .contact-points a {
    display: flex;
    align-items: center;
    line-height: 1.4rem;
    gap: 8px;
    font-family: var(--sans);
    font-size: 0.875rem;
  }
</style>