<script>
  import chroma from 'chroma-js';
  import { getTailwindColors } from "uicolors-generator";
  import { fade } from 'svelte/transition';


  import CssIcon from '$lib/assets/css.svg';
  import SvgIcon from '$lib/assets/svg.svg';
  import FigmaIcon from '~icons/ph/figma-logo';
  import ArrayIcon from '~icons/material-symbols/data-array-rounded';
  import ColourIcon from '~icons/tabler/color-filter';

  import Swatch from '$lib/components/Swatch.svelte';
  import StepChart from '$lib/components/StepChart.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import ButtonGroup from '$lib/components/ButtonGroup.svelte';
  import ButtonGroupBoolean from '$lib/components/ButtonGroupBoolean.svelte';
	
  const colourSpacesOLD = ['lab', 'lab-bezier', 'lch','hsl', 'hsv', 'rgb', 'oklab', 'oklch'];
  const colourSpaces = [
    { label: 'LAB', value: 'lab', icon: ColourIcon },
    { label: 'OK LAB', value: 'oklab' },
    { label: 'BEZ LAB', value: 'lab-bezier'},
    { label: 'LCH', value: 'lch', icon: ColourIcon },
    { label: 'OK LCH', value: 'oklch' },
    { label: 'HSL', value: 'hsl', icon: ColourIcon },
    { label: 'HSV', value: 'hsv', icon: ColourIcon },
    { label: 'RGB', value: 'rgb', icon: ColourIcon },
  ];
  
  let inputValue = $state('purple');
  let nameValue = $state('');
  let numColours = $state(11);
  // let startExtend = $state(0);
  let colorSpace = $state('lch');
  let correctLightness = $state(false);
  let blackBackground = $state(false);
  let keepOriginal = $state(false);
  let stepwise = $state(false);
  let backgroundColor = $derived( blackBackground ? '#000000' : '#ffffff');
  let toastOn = $state(false);
  let toastEvent = $state(null);
  let clipboardMessage = $state('');

  // let appColours = $derived(getTailwindColors(backgroundColor, {asHex: true}));
  let appColoursCss = $derived(getAppColoursCss(blackBackground));


  let parsedNames = $derived(nameParse(inputValue));
  let parsedColours = $derived(colourParse(inputValue || '#000000'));
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
    else if (stepwise) {
      // Calculate lightness for each color
      const lightnesses = colourList.map(c => chroma(c).lab()[0]);
      
      // Calculate lightness differences between consecutive colors
      const diffs = [];
      for (let i = 0; i < lightnesses.length - 1; i++) {
        diffs.push(Math.abs(lightnesses[i + 1] - lightnesses[i]));
      }
      
      // Calculate total lightness difference
      const totalDiff = diffs.reduce((sum, d) => sum + d, 0);
      
      // Calculate how many colors should go in each segment
      // We have (numColours - colourList.length) colors to distribute
      const colorsToDistribute = numColours - colourList.length;
      
      const segmentCounts = diffs.map(diff => {
        return Math.round((diff / totalDiff) * colorsToDistribute);
      });
      
      // Adjust for rounding errors to ensure we have exactly the right number of colors
      const totalAllocated = segmentCounts.reduce((sum, c) => sum + c, 0);
      const adjustment = colorsToDistribute - totalAllocated;
      if (adjustment !== 0) {
        // Add/subtract from the largest segment
        const maxIndex = segmentCounts.indexOf(Math.max(...segmentCounts));
        segmentCounts[maxIndex] += adjustment;
      }
      
      // Build the result by interpolating between each pair of colors
      const colorResult = [];
      for (let i = 0; i < colourList.length - 1; i++) {
        const segmentColors = segmentCounts[i] + 2; // +2 to include both endpoints
        const segment = chroma.scale([colourList[i], colourList[i + 1]])
          .mode(colorSpace === 'lab-bezier' ? 'lab' : colorSpace)
          .correctLightness(correctLightness)
          .colors(segmentColors);
        
        // Add all colors except the last one (to avoid duplicates)
        colorResult.push(...segment.slice(0, -1));
      }
      
      // Add the final color
      colorResult.push(colourList[colourList.length - 1]);
      
      return colorResult;
    }

    scale = colorSpace === 'lab-bezier'
      ? chroma.bezier(colourList).scale()
      : chroma.scale(colourList).mode(colorSpace);

    let colorResult = scale.correctLightness(correctLightness).domain(domainVals).colors(numColours);

    // If keepOriginal is true, replace closest colors with original colors
    if (keepOriginal) {
      // Identify colors from colourList that are not in colorResult
      const originalColors = colourList.filter(original => {
        const originalHex = chroma(original).hex().toLowerCase();
        return !colorResult.some(result => chroma(result).hex().toLowerCase() === originalHex);
      });

      // For each original color not in the result, find and replace the closest color
      originalColors.forEach(original => {
        let minDistance = Infinity;
        let closestIndex = -1;

        colorResult.forEach((result, index) => {
          const distance = chroma.distance(original, result);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = index;
          }
        });

        if (closestIndex !== -1) {
          colorResult[closestIndex] = chroma(original).hex();
        }
      });
    }

    return colorResult
  }

 

  function tailwindifyInput(colours) {
    console.log('Input colours:', colours);
    
    // Sort colors by lightness (lightest to darkest)
    const sortedColours = [...colours].sort((a, b) => {
      return chroma(b).lab()[0] - chroma(a).lab()[0];
    });
    
    console.log('Sorted colours:', sortedColours);
    
    let tailwindPosns = [];
    let firstTailwindColors = null;
    let lastTailwindColors = null;
    
    sortedColours.forEach((c, index) => {
      const twColors = getTailwindColors(c, {asHex: true});
      console.log('getTailwindColors result for', c, ':', twColors);
      
      if (index === 0) {
        firstTailwindColors = twColors;
      }
      if (index === sortedColours.length - 1) {
        lastTailwindColors = twColors;
      }
      
      const colorHex = chroma(c).hex().toLowerCase();
      const tailwindValues = Object.values(twColors);
      const originalIndex = tailwindValues.findIndex(hex => hex.toLowerCase() === colorHex);
      
      const mappedPosition = originalIndex !== -1 ? originalIndex : 5;
      tailwindPosns.push(mappedPosition);
    });
    
    // If first color's position isn't 0 and we have colors, add the first tailwind color
    if (tailwindPosns[0] > 0 && sortedColours.length > 0 && firstTailwindColors) {
      const firstTailwindColor = Object.values(firstTailwindColors)[0];
      sortedColours.unshift(firstTailwindColor);
      tailwindPosns.unshift(0);
    }
    
    // If last color's position isn't 10 and we have colors, add the last tailwind color
    const lastIdx = tailwindPosns.length - 1;
    if (tailwindPosns[lastIdx] < 10 && sortedColours.length > 0 && lastTailwindColors) {
      const lastTailwindColor = Object.values(lastTailwindColors)[10];
      sortedColours.push(lastTailwindColor);
      tailwindPosns.push(10);
    }
    
    console.log('After adding first and last:', sortedColours, tailwindPosns);
    
    return sortedColours.toString().replace(/[\[\]]/g, '');
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
    // Strip out square brackets and single or double quotes
    const cleanedStr = str.replace(/[\[\]'"]+/g, '');
    const parts = cleanedStr.split(/[;,]+/).map(s => s.trim()).filter(Boolean);
    
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
    const baseName = nameValue.trim() ? nameValue.trim().toLowerCase().replace(/\s+/g, '-') : 'color-name';
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

   // Copy to clipboard with proper error handling and return values
   const copyToClipboardCall = async (text) => {
    try {
      // Attempt to use the modern clipboard API
      await navigator.clipboard.writeText(text);
      console.log('Copied "' + text + '" to clipboard');
      return { success: true, message: 'Text copied to clipboard successfully' };
    } catch (e1) {
      console.log('navigator.clipboard.writeText not working, trying execCommand');
      
      // Fallback to execCommand for older browsers
      try {
        // Create a temporary input element
        const inputElement = document.createElement('input');
        inputElement.value = text;
        inputElement.style.position = 'absolute';
        inputElement.style.left = '-9999px'; // Move it off-screen
        document.body.appendChild(inputElement);

        // Select the text and execute the copy command
        inputElement.select();
        const successful = document.execCommand('copy');
        
        // Remove the temporary input element
        document.body.removeChild(inputElement);
        
        if (successful) {
          console.log('Copy command was successful');
          return { success: true, message: 'Text copied to clipboard successfully' };
        } else {
          console.log('Copy command was unsuccessful');
          return { success: false, error: 'Copy command failed' };
        }
      } catch (e2) {
        console.error('Could not copy to clipboard', e2);
        return { success: false, error: 'Failed to copy to clipboard: ' + e2.message };
      }
    }
  };

  async function copyToClipboard(text, e, type="") {
    console.log('copyToClipboard called', { e, hasTarget: !!e?.target });
    toastEvent = e;
    let result = await copyToClipboardCall(text);
    clipboardMessage = result.success ? type + ' copied to clipboard' : 'Failed to copy to clipboard.';
    toastOn = true;
    console.log('toastOn set to true, toastEvent:', toastEvent);
    setTimeout(() => { toastOn = false; }, 1400);
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

  function cleanColours() {
    inputValue = transformedColours.toString().replace(/,/g, ", ");
  }

  function spaceToComma() {
    const commas = inputValue.replace(/\s+/g, ',');
    inputValue = commas;
  }

  function applyTailwindify() {
    const newInput = tailwindifyInput(parsedColours);
    inputValue = newInput;

    // transformedColours = tailwindify(parsedColours);
  }

  function clearInput() {
    inputValue = '';
  }

  $inspect(inputValue);


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

  function getAppColoursCss(blackBackground) {


    let css = `
    	--app-50: var(--brown-50);
    	--app-100: var(--brown-100);
    	--app-200: var(--brown-200);
    	--app-300: var(--brown-300);
    	--app-400: var(--brown-400);
    	--app-500: var(--brown-500);
    	--app-600: var(--brown-600);
    	--app-700: var(--brown-700);
    	--app-800: var(--brown-800);
    	--app-900: var(--brown-900);
      `;

    if (blackBackground) {
      css = `
        --app-50: var(--brown-900);
        --app-100: var(--brown-800);
        --app-200: var(--brown-700);
        --app-300: var(--brown-600);
        --app-400: var(--brown-500);
        --app-500: var(--brown-400);
        --app-600: var(--brown-300);
        --app-700: var(--brown-200);
        --app-800: var(--brown-100);
        --app-900: var(--brown-50); 
        `;
    }
    return css;
  }

</script>


<div class="container" style="--sel-background: {backgroundColor}; {appColoursCss}">

  <div class="box">
    <div class="row">
      <h2>Inputs</h2>
      <div class="button-section">
        <button onclick={cleanColours}>clean</button>
        <button onclick={reverseColours}>reverse</button>
        <button onclick={spaceToComma}>delimit</button>
        <button onclick={applyTailwindify}>extend</button>
        <button onclick={clearInput}>clear</button>
        <button onclick={(e) => copyToClipboard(inputCssValue, e, "CSS")}><CssIcon height={20} width={20}/></button>
        <button onclick={(e) => copyToClipboard(inputFigmaValue, e, "Figma import")}><FigmaIcon height={20} width={20} /></button>
        <!-- <label for="background-color">Background:</label>
        <input type="color" id="background-color" name="background-color" bind:value={backgroundColor}> -->
      </div>
    </div>

    <div class="row">  
      <input
        type="text"
        bind:value={inputValue}
        placeholder="enter colours separated by commas"
        class="big-input"
      />
    </div>



    <div class="row" style="align-items: center;">
      <svg width="1000px" height="32px" viewBox="0 0 1000 32" xmlns="http://www.w3.org/2000/svg">
        {#each parsedColours as colour, i}
          <Swatch {colour} name={''} x={i*72} width={68} short={true}   />
        {/each}
      </svg>
    </div>
  </div>

  <div class="box">
    <div class="row">
      <h2>Configuration</h2>

      <div style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
        <label for="name-input" class="small-label" style="white-space: nowrap">export name</label>
        <input
          id="name-input"
          type="text"
          bind:value={nameValue}
          placeholder="color-name"
          style="width: 174px;"
        />
      </div>
    </div>  
    <div class="row bottom-align">  
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



      <ButtonGroupBoolean bind:value={correctLightness} label="correct lightness" />
      <ButtonGroupBoolean bind:value={stepwise} label="stepwise interpolation" />
      <ButtonGroupBoolean bind:value={keepOriginal} label="keep input colours" />
      <ButtonGroupBoolean bind:value={blackBackground} label="black background" />


      <ButtonGroup bind:selected={colorSpace} options={colourSpaces} labelAbove={true} label="color<br>space" />




      <div class="num-input">
        <label for="num-colours" class="small-label">number<br>of colours</label>
        <input
          id="num-colours"
          type="number"
          bind:value={numColours}
          min="2"
          max="20"
          style="width: 100px;"
        />  
      </div>

    </div>
  </div>

  <div class="box">
    <div class="row">
      <h2>Results</h2>
      <div class="group-of-buttons-w-label">
        <div class="small-label">export</div>
        <div class="button-section">
          <button onclick={(e) => copyToClipboard("'" + transformedColours.toString().replace(/,/g, "', '") + "'",e, "Array")}><ArrayIcon height={20} width={20} /></button>
          <button onclick={(e) => copyToClipboard(outputCssValue, e, "CSS")}><CssIcon height={20} width={20} /></button>
          <button onclick={(e) => copyToClipboard(getSVG(), e, "SVG")}><SvgIcon height={20} width={20} /></button>
          <button onclick={(e) => copyToClipboard(outputFigmaValue, e, "Figma import")}><FigmaIcon height={20} width={20} /></button>
        </div>
      </div>
    </div>
    <svg bind:this={svgRef} width="1000px" height="100px" viewBox="0 0 1000 100" xmlns="http://www.w3.org/2000/svg">
      {#each transformedColours as colour, i}
        <Swatch {colour} name={outputNames[i]} x={i*Math.min(15000, 1006/numColours)} width={Math.min(15000,1006/numColours-6)} />
      {/each}
    </svg>

    <StepChart values={lightnessArray} size={1000} />
  </div>

  {#if toastOn && toastEvent}
    <div transition:fade>
      <Tooltip mouseEvent={toastEvent} centered={true}>
        <div class="tip-text">
          {clipboardMessage}
        </div>
      </Tooltip>
    </div>
  {/if}

</div>


<style>

  :global(body) {
    background-color: var(--sel-background);
  }

  :global(.full-width) {
    background-color: var(--sel-background);
  }


  .row {
    display: flex;
    gap: 30px;
    align-items: center;
  }

  .row.bottom-align {
    align-items: flex-end
  }

  .box {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 1040px;
    margin: auto;
    padding: 16px 20px 16px 20px;
    border-radius: 8px;
    border: 1px solid var(--brown-50);
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.25);
    width: 100%;
  }
  .big-checkbox {
    width: 20px;
    height: 20px;
  }

  input {
    display: block;
    font-size: 16px;
    height: 36px;
    border: 1px solid var(--brown-100);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    padding: 10px;
    background-color: white;
    color: var(--text-colour);
  }

  input::placeholder {
    color: var(--grey-300);
    font-size: 0.875em;
    opacity: 1;
  }



  .big-input {
    width: 100%;
    min-height: 40px;
    /* resize: vertical; */
  }

  label {
    display: block;
  }

  select {
    min-height: 50px;
    border-radius: 6px;
  }

  button {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brown-700);
    padding: 0px 10px;
    border: 1px solid var(--brown-100);
    border-radius: 6px;
    background-color: var(--brown-50);
    height: 36px;
    font-size: 12px;
    letter-spacing: -0.5px;
    cursor: pointer;
  }

  .button-section {
    display: flex;
    gap: 2px;
  }

  .group-of-buttons-w-label {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 1080px;
    margin: 70px auto 0px;
    padding: 20px;
    background-color: var(--sel-background);
  }

  .mq-mobile.container {
    padding: 0 24px;
  }

  h1 {
    text-align: center;
    font-size: 1.75rem;
    max-width: 800px;
    margin: auto;
    letter-spacing: -0.05em;
  }

  h2 {
    color: var(--text-colour);
    text-align: left;
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    display: table;
    border-radius: 3px ;
  }

  h2 {
    position: sticky;
    top: 70px;
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

  .small-label {
    font-size:12px; 
    color:var(--brown-500);
  }


  .tip-text {
    border-radius: 6px;
    background-color: var(--brown-100);
    color: var(--brown-600);
    padding: 8px 12px;
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