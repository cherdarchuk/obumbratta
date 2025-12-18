<script>
  import chroma from 'chroma-js';
  import { getTailwindColors } from "uicolors-generator";
  import { fade } from 'svelte/transition';
  import { copyToClipboard as copyToClipboardCall } from '$lib/helpers/utils.js';


  import CssIcon from '$lib/assets/css.svg';
  import SvgIcon from '$lib/assets/svg.svg';
  import FigmaIcon from '~icons/ph/figma-logo';
  import ArrayIcon from '~icons/material-symbols/data-array-rounded';
  import WarnIcon from '~icons/mdi/exclamation-thick';
  import CheckIcon from '~icons/material-symbols/check-rounded';
  import ColourIcon from '~icons/tabler/color-filter';
  import { getSimulatedColors, isColorBlindSafe } from '$lib/helpers/colorBlind.js';

  import Swatch from '$lib/components/Swatch.svelte';
  import MultiLineChart from '$lib/components/MultiLineChart.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import ButtonGroup from '$lib/components/ButtonGroup.svelte';
  import Toggle from '$lib/components/Toggle.svelte';
	
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

  
  let inputValue = $state("lightyellow, f8f, '#02439e'");
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
  let colorBlindType = $state('deuteranopia');


  // let appColours = $derived(getTailwindColors(backgroundColor, {asHex: true}));
  let appColoursCss = $derived(getAppColoursCss(blackBackground));

  // Toggle a body class so this page can force a black background independent of +layout
  $effect(() => {
    if (blackBackground) {
      document.body.classList.add('page-black-bg');
    } else {
      document.body.classList.remove('page-black-bg');
    }
  });


  let parsedNames = $derived(nameParse(inputValue));
  let parsedColours = $derived(colourParse(inputValue || '#000000'));
  let transformedColours = $derived(interpolateColors(parsedColours));
  let colorBlindColours = $derived(getSimulatedColors(transformedColours, colorBlindType));
  let outputNames = $derived(getDefaultNameVals(transformedColours.length));
  let lightnessArray = $derived(transformedColours.map(c => chroma(c).lab()[0]));
  // let colourNameSuggestion = $derived(() => {
  //   if (parsedColours.length === 0) return 'color-name';
  //   const firstColour = parsedColours[0];
  //   const ntcMatch = ntc.name(firstColour);
  //   let baseName = ntcMatch[1].toLowerCase().replace(/\s+/g, '-');
  //   return baseName;
  // }); 

  let colourBlindnessTypesWarn = $derived(
    [
      { label: 'deutan', value: 'deuteranopia', icon: isColorBlindSafe(transformedColours, 'protanopia').length < 1 ? CheckIcon : WarnIcon },
      { label: 'protan', value: 'protanopia', icon: isColorBlindSafe(transformedColours, 'deuteranopia').length < 1 ? CheckIcon : WarnIcon },
      { label: 'tritan', value: 'tritanopia', icon: isColorBlindSafe(transformedColours, 'tritanopia').length < 1 ? CheckIcon : WarnIcon },
    ]
  );

  $inspect(colourBlindnessTypesWarn);
  
  // Transform for MultiLineChart - expects array of objects with series
  let lightnessChartData = $derived(
    [...lightnessArray, lightnessArray[lightnessArray.length - 1]].map((val, i) => ({ 
      index: i, 
      lightness: val, 
      series: 'L*' 
    }))
  );



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
    const baseName = nameValue.trim() ? nameValue.trim().toLowerCase().replace(/\s+/g, '-') : 'colour-name';
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

   
  async function copyToClipboard(text, e, type="") {
    toastEvent = e;
    let result = await copyToClipboardCall(text);
    clipboardMessage = result.success ? type + ' copied to clipboard' : 'Failed to copy to clipboard.';
    toastOn = true;
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
    inputValue = parsedColours.toString().replace(/,/g, ", ");
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

      --placeholder-color: var(--grey-300);

      --app-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.25);
      --chart-background: rgba(0, 0, 0, 0.03);
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

        --placeholder-color: var(--grey-700);
        
        --app-shadow: 0 2px 4px 0 rgba(255, 255, 255, 0.25);
        --chart-background: rgba(255, 255, 255, 0.1);
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
        <button onclick={(e) => copyToClipboard(inputCssValue, e, "CSS")} class="desktop-only"><CssIcon height={20} width={20}/></button>
        <button onclick={(e) => copyToClipboard(inputFigmaValue, e, "Figma import")} class="desktop-only"><FigmaIcon height={20} width={20} /></button>
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



    <div class="swatch-row">
        {#each parsedColours as colour, i}
          <Swatch {colour} name={colour} x={i*72} width={68} div={true}   />
        {/each}
    </div>
  </div>

  <div class="box">
    <div class="row">
      <h2>Configuration</h2>

      <div style="display: flex; flex-direction: row; align-items: center; gap: 10px;">
        <label for="name-input" class="small-label desktop-only" style="white-space: nowrap">export name</label>
        <input
          id="name-input"
          type="text"
          bind:value={nameValue}
          placeholder="colour-name"
          style="width: 174px;"
          autocomplete="off"
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



      <Toggle bind:value={correctLightness} label="correct lightness" />
      <Toggle bind:value={stepwise} label="intelligent interpolation" />
      <Toggle bind:value={keepOriginal} label="maintain    input colours" />
      <Toggle bind:value={blackBackground} label="black background" />


      <ButtonGroup bind:selected={colorSpace} options={colourSpaces} labelAbove={true} label="colour<br>space" />




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
          <button onclick={(e) => copyToClipboard("['" + transformedColours.toString().replace(/,/g, "', '") + "']",e, "Array")}><ArrayIcon height={20} width={20} /></button>
          <button onclick={(e) => copyToClipboard(outputCssValue, e, "CSS")}><CssIcon height={20} width={20} /></button>
          <button onclick={(e) => copyToClipboard(getSVG(), e, "SVG")}><SvgIcon height={20} width={20} /></button>
          <button onclick={(e) => copyToClipboard(outputFigmaValue, e, "Figma import")}><FigmaIcon height={20} width={20} /></button>
        </div>
      </div>
    </div>
    <svg bind:this={svgRef} viewBox="0 0 1000 100" xmlns="http://www.w3.org/2000/svg">
      {#each transformedColours as colour, i}
        <Swatch 
          {colour} 
          name={outputNames[i]} 
          x={i*Math.min(15000, 1006/numColours)} 
          width={Math.min(15000,1006/numColours-6)} 
          oncopy={(text, e, type) => copyToClipboard(text, e, type)}
        />
      {/each}
    </svg>

    {#if lightnessArray.length > 0}
      <div class="chart-container">
        <MultiLineChart 
          data={lightnessChartData} 
          x="index"
          y="lightness"
          series="series"
          yDomain={[0, 100]}
          showXAxis={false}
      		padding={{ top: 0, right: 0, bottom: 0, left: 0 }}
          colors={['var(--app-500)']}
          title="perceptual lightness"
        />
      </div>

    {/if}

    <div style="display: flex; align-items: center; justify-content: center;">
      <ButtonGroup bind:selected={colorBlindType} options={colourBlindnessTypesWarn} label="colour blindness" />
    </div>
    <svg bind:this={svgRef} viewBox="0 0 1000 40" xmlns="http://www.w3.org/2000/svg">
      {#each colorBlindColours as colour, i}
        <Swatch 
          {colour} 
          name={outputNames[i]} 
          x={i*Math.min(15000, 1006/numColours)} 
          width={Math.min(15000,1006/numColours-6)} 
          short={true}
          warn = {isColorBlindSafe(transformedColours, colorBlindType).includes(colour)}
        />
      {/each}
    </svg>
      
    <a href="https://www.ncbi.nlm.nih.gov/books/NBK11538/table/ch28kallcolor.T1/" target="_blank" rel="noopener noreferrer">
      reference
    </a>


  </div>

</div>

{#if toastOn && toastEvent}
  <div class="toast-wrapper" transition:fade={{ duration: 200 }} style={appColoursCss}>
    <Tooltip mouseEvent={toastEvent} centered={true}>
      <div class="tip-text">
        {clipboardMessage}
      </div>
    </Tooltip>
  </div>
{/if}


<style>


  :global(body) {
    background-color: var(--sel-background);
  }

  /* When this page toggles black background, override layout using a body class */
  :global(body.page-black-bg) {
    background-color: #000 !important;
  }

  :global(.full-width) {
    background-color: var(--sel-background);
  }

  /* Stronger header overrides when page-black-bg is active */
  :global(body.page-black-bg .full-width) {
    background-color: var(--grey-900) !important;
  }


  .row {
    display: flex;
    column-gap: 30px;
    row-gap: 10px;
    align-items: center;
  }

  .row.bottom-align {
    align-items: flex-end;
  }

  @media (max-width: 990px) {
    .row.bottom-align {
      margin-top: 10px;
      flex-wrap: wrap;
    }
  }

  .swatch-row {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-wrap: wrap;
  }

  .box {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-width: 1040px;
    margin: auto;
    padding: 16px 20px 16px 20px;
    border-radius: 8px;
    border: 1px solid var(--app-50);
    box-shadow: var(--app-shadow);
    width: 100%;
  }

  .box:last-child {
    margin-bottom: 70px;
  }

  input {
    display: block;
    font-size: 16px;
    height: 36px;
    border: 1px solid var(--app-100);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.15);
    border-radius: 6px;
    padding: 10px;
    background-color: var(--sel-background);
    color: var(--app-900);
  }

  input::placeholder {
    color: var(--placeholder-color);
    font-size: 0.875em;
    opacity: 1;
  }



  .big-input {
    width: 100%;
    min-height: 40px;
    /* resize: vertical; */
  }



  button {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--app-700);
    padding: 0px 10px;
    border: 1px solid var(--app-100);
    border-radius: 6px;
    background-color: var(--app-50);
    height: 36px;
    font-size: 12px;
    letter-spacing: -0.5px;
    cursor: pointer;
  }

  :global(button > *) {
    pointer-events: none;
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
    margin: 0 auto 0px;
    padding: 20px;
    background-color: var(--sel-background);
  }


  h2 {
    color: var(--app-800);
    text-align: left;
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    display: table;
    border-radius: 3px;
    width: 100%;
  }




  h3 {
    text-align: center;
    font-size: 1rem;
    color: var(--grey-600);
  }


  .small-label {
    font-size:12px; 
    color:var(--app-500);
  }


  .tip-text {
    border-radius: 6px;
    background-color: var(--app-100);
    color: var(--app-600);
    padding: 8px 12px;
  }

  .chart-container {
    height: 200px;
    background-color: var(--chart-background);
  }

  .toast-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
  }


</style>