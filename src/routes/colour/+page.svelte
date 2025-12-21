<script>
  import chroma from 'chroma-js';
  import { fade } from 'svelte/transition';
  import { copyToClipboard as copyToClipboardCall } from '$lib/helpers/utils.js';
  import { getClosestColorName } from '$lib/helpers/colorName.js';
  import { 
    interpolateColors, 
    checkDivergingColors, 
    colourParse, 
    nameParse, 
    getDefaultNameVals, 
    tailwindifyInput 
  } from '$lib/helpers/paletteLogic.js';
  import { reorderInputColours, updateInputColour } from '$lib/helpers/inputLogic.js';
  import { getCSS, convertCssVariables } from '$lib/helpers/exporters.js';


  import CssIcon from '$lib/assets/css.svg';
  import SvgIcon from '$lib/assets/svg.svg';
  import FigmaIcon from '~icons/ph/figma-logo';
  import ArrayIcon from '~icons/material-symbols/data-array-rounded';
  import WarnIcon from '~icons/material-symbols/warning-outline';
  import CheckIcon from '~icons/material-symbols/check-rounded';
  import ColourIcon from '~icons/tabler/color-filter';
  import { isColorBlindSafe } from '$lib/helpers/colorBlind.js';

  import Swatch from '$lib/components/Swatch.svelte';
  import MultiLineChart from '$lib/components/MultiLineChart.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import ButtonGroup from '$lib/components/ButtonGroup.svelte';
  import Toggle from '$lib/components/Toggle.svelte';
	import ColourTests from '$lib/components/ColourTests.svelte';
	
  const colourSpaces = [
    { label: 'LAB', value: 'lab', icon: ColourIcon },
    { label: 'BEZ LAB', value: 'lab-bezier'},
    { label: 'OK LAB', value: 'oklab' },
    { label: 'LCH', value: 'lch', icon: ColourIcon },
    { label: 'OK LCH', value: 'oklch' },
    { label: 'HSL', value: 'hsl', icon: ColourIcon },
    { label: 'HSV', value: 'hsv', icon: ColourIcon },
    { label: 'RGB', value: 'rgb', icon: ColourIcon },
  ];



  
  let inputValue = $state("lightyellow, f8f, '#02439e'");
  let inputName = $state('');

  let numColours = $state(11);
  let colorSpace = $state('lch');
  let correctLightness = $state(false);
  let blackBackground = $state(false);
  let keepOriginal = $state(false);
  let stepwise = $state(false);
  let backgroundColor = $derived( blackBackground ? '#000000' : '#ffffff');
  let resultsView = $state('lightness');


  let toastOn = $state(false);
  let toastEvent = $state(null);
  let clipboardMessage = $state('');
  



  // let appColours = $derived(getTailwindColors(backgroundColor, {asHex: true}));

  // Toggle a body class so this page can force a black background independent of +layout
  $effect(() => {
    // Set CSS variables on body to control global background and header color
    document.body.style.setProperty('--sel-background', backgroundColor);
    
    if (blackBackground) {
      document.body.classList.add('page-black-bg');
      // Override header background color (which uses --back-colour)
      document.body.style.setProperty('--back-colour', 'var(--grey-900)');
    } else {
      document.body.classList.remove('page-black-bg');
      // Ensure header matches the white page background
      document.body.style.setProperty('--back-colour', '#ffffff');
    }

    return () => {
      document.body.classList.remove('page-black-bg');
      document.body.style.removeProperty('--sel-background');
      document.body.style.removeProperty('--back-colour');
    }
  });


  let parsedNames = $derived(nameParse(inputValue));
  let parsedColours = $derived(colourParse(inputValue || '#000000'));
  let divergingColour = $derived(checkDivergingColors(parsedColours));

  let transformedColours = $derived(interpolateColors(parsedColours, {
    numColours,
    stepwise,
    colorSpace,
    correctLightness,
    keepOriginal,
    divergingColour
  }));

  let outputNames = $derived(getDefaultNameVals(transformedColours.length));
  let lightnessArray = $derived(transformedColours.map(c => chroma(c).lab()[0]));
  let colourNameSuggestion = $derived(
    transformedColours.length > 0 
      ? getClosestColorName(transformedColours[Math.floor(transformedColours.length/2)])
      : 'colour-name'
  );
  let nameValue = $derived(inputName.trim() ? inputName.trim() : colourNameSuggestion);

  
  const colourBlindnessTypes = ['protanopia', 'deuteranopia', 'tritanopia'];
  let colourBlindWarn = $derived(colourBlindnessTypes.some((d) => isColorBlindSafe(transformedColours, d).length > 1));

  let resultsViews = $derived([
    { label: 'perceptual lightness', value: 'lightness' },
    { label: 'colour blindness', value: 'blindness', icon: colourBlindWarn ? WarnIcon : null },
  ]);

  
  // Transform for MultiLineChart - expects array of objects with series
  let lightnessChartData = $derived(
    [...lightnessArray, lightnessArray[lightnessArray.length - 1]].map((val, i) => ({ 
      index: i, 
      lightness: val, 
      series: 'L*' 
    }))
  );



  let inputCssValue = $derived(getCSS(parsedColours, parsedNames.length > 0 ? parsedNames : [nameValue] ));
  let outputCssValue = $derived(getCSS(transformedColours, [nameValue]));

  let inputFigmaValue = $derived(convertCssVariables(inputCssValue)); 
  let outputFigmaValue = $derived(convertCssVariables(outputCssValue)); 
  let svgRef;

 

  let draggingIndex = $state(null);

  function handleDragStart(e, index) {
    draggingIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e, index) {
    e.preventDefault();
    if (draggingIndex === null) return;
    
    inputValue = reorderInputColours(inputValue, draggingIndex, index);
    draggingIndex = null;
  }

  function addColourToInput(hex, index) {
    const N = parsedColours.length;
    const M = transformedColours.length;
    
    let insertAt = N; // Default to append
    
    if (N > 1 && M > 1 && typeof index === 'number') {
      const segmentIndex = Math.floor(index * (N - 1) / (M - 1));
      insertAt = segmentIndex + 1;
    }

    const newColours = [
      ...parsedColours.slice(0, insertAt),
      hex,
      ...parsedColours.slice(insertAt)
    ];
    
    inputValue = newColours.join(', ');
  }

  function removeColourFromInput(index) {
    const newColours = [...parsedColours];
    newColours.splice(index, 1);
    inputValue = newColours.join(', ');
  }


  function getSVG() {
    if (!svgRef) return;
    // Serialize the SVG node to a string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef);
    return svgString;
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

</script>


<div class="container" class:dark={blackBackground} style="--sel-background: {backgroundColor}">

  <div class="box">
    <div class="row">
      <h2>Inputs</h2>
      <div class="button-section">
        <button onclick={cleanColours}>clean</button>
        <button onclick={reverseColours}>reverse</button>
        <!-- <button onclick={spaceToComma}>delimit</button> -->
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
          <div
            role="group"
            draggable={true}
            ondragstart={(e) => handleDragStart(e, i)}
            ondrop={(e) => handleDrop(e, i)}
            ondragover={(e) => handleDragOver(e, i)}
            style="cursor: grab;"
          >
            <Swatch 
              {colour} 
              name={colour} 
              x={i*72} 
              width={68} 
              div={true} 
              onchange={(newHex) => inputValue = updateInputColour(inputValue, i, newHex)} 
              onremove={() => removeColourFromInput(i)}
            />
          </div>
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
          bind:value={inputName}
          placeholder={colourNameSuggestion}
          style="width: 174px;"
          autocomplete="off"
        />
      </div>
    </div>  
    <div class="row bottom-align">  



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
          oninsert={(hex) => addColourToInput(hex, i)}
        />
      {/each}
    </svg>

    
    {#if lightnessArray.length > 0 && resultsView === 'lightness'}
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
    {:else if resultsView === 'blindness'}
      
      <ColourTests colours={transformedColours} bind:warn={colourBlindWarn} />

    {/if}



    <div style="display: flex; align-items: center; justify-content: center;">
      <ButtonGroup bind:selected={resultsView} options={resultsViews} stack={false} --max-width="150px" --min-width="140px" --icon-size="14px" />
    </div>
      



  </div>

</div>

{#if toastOn && toastEvent}
  <div class="toast-wrapper" class:dark={blackBackground} transition:fade={{ duration: 200 }}>
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
  .swatch-row input {
		width: 68px;
		height: 32px;
		border: 0;
		padding: 0;
		background: transparent;
		position: absolute;
		opacity: 0.5;
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

  .container, .toast-wrapper {
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
  }

  .container.dark, .toast-wrapper.dark {
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