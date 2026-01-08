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
    tailwindifyInput,
    createSampleColours,
  } from '$lib/helpers/paletteLogic.js';
  import { reorderInputColours, updateInputColour } from '$lib/helpers/inputLogic.js';
  import { getCSS, convertCssVariables } from '$lib/helpers/exporters.js';
  import { isColorBlindSafe } from '$lib/helpers/colorBlind.js';
  import { HistoryState } from '$lib/helpers/history.svelte.js';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { generateUrl } from '$lib/helpers/deepLink.svelte.js';


  import CssIcon from '$lib/assets/css.svg';
  import SvgIcon from '$lib/assets/svg.svg';
  import FigmaIcon from '~icons/ph/figma-logo';
  import ArrayIcon from '~icons/material-symbols/data-array-rounded';
  import WarnIcon from '~icons/mingcute/alert-line';
  import ColourIcon from '~icons/tabler/color-filter';
  import LinkIcon from '~icons/mdi/link-variant';

  import Swatch from '$lib/components/Swatch.svelte';
  import MultiLineChart from '$lib/components/MultiLineChart.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import ButtonGroup from '$lib/components/ButtonGroup.svelte';
  import Toggle from '$lib/components/Toggle.svelte';
	import ColourTests from '$lib/components/ColourTests.svelte';
	import SampleMap from '$lib/components/SampleMap.svelte';
	import SampleChord from '$lib/components/SampleChord.svelte';
  import SampleArea from '$lib/components/SampleArea.svelte';
	import SampleBar from '$lib/components/SampleBar.svelte';
  import SampleIcons from '$lib/components/SampleIcons.svelte';
	import SampleChonk from '$lib/components/SampleChonk.svelte';
	import SampleClock from '$lib/components/SampleClock.svelte';
	import SampleTrend from '$lib/components/SampleTrend.svelte';
	import ContrastRatios from '$lib/components/ContrastRatios.svelte';
	import ColourPlot from '$lib/components/ColourPlot.svelte';
	
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
  
  let hoverTooltipEvent = $state(null);
  let hoverTooltipText = $state('');


  // Handle URL parameters on initial load
  onMount(() => {
    const params = page.url.searchParams;
    // Loop through all URL parameters and update appState if the property exists
    for (const [key, value] of params.entries()) {
      if (key === 'inputValue') inputValue = value;
      if (key === 'numColours') numColours = parseInt(value) || 11;
      if (key === 'colorSpace') colorSpace = value;
      if (key === 'correctLightness') correctLightness = value === 'true';
      if (key === 'blackBackground') blackBackground = value === 'true';
      if (key === 'keepOriginal') keepOriginal = value === 'true';
      if (key === 'stepwise') stepwise = value === 'true';
      if (key === 'inputName') inputName = value;
    }
  });



  const history = new HistoryState(
		() => inputValue,          // getter
		(v) => inputValue = v      // setter
	);

  function showTooltip(e, text) {
    hoverTooltipEvent = e;
    hoverTooltipText = text;
  }

  function hideTooltip() {
    hoverTooltipEvent = null;
    hoverTooltipText = '';
  }
  



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
    { label: 'colour plot', value: 'plot' },
    { label: 'colour blindness', value: 'blindness', icon: colourBlindWarn ? WarnIcon : null },
    { label: 'contrast ratios', value: 'contrast' },
    { label: 'sample visuals', value: 'viz' },
    { label: 'sample ui', value: 'ui' },
    { label: 'credits', value: 'credits' },
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

 
  function handleKeydown(e) {
      const isMod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      if (isMod) {
          // UNDO: Cmd+Z or Ctrl+Z
          if (key === 'z' && !e.shiftKey) {
              e.preventDefault();
              history.undo();
          }

          // REDO: Cmd+Shift+Z, Ctrl+Shift+Z, or Ctrl+Y
          if ((key === 'z' && e.shiftKey) || key === 'y') {
              e.preventDefault();
              history.redo();
          }
      }
  }

  let draggingIndex = $state(null);
  let dragOverIndex = $state(null);

  function handleDragStart(e, index) {
    draggingIndex = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverIndex = index;
  }

  function handleDragEnd() {
    draggingIndex = null;
    dragOverIndex = null;
  }

  function handleDrop(e, index) {
    e.preventDefault();
    e.stopPropagation();
    if (draggingIndex === null || index === null) return;
    
    inputValue = reorderInputColours(inputValue, draggingIndex, index);
    history.snapshot();
    draggingIndex = null;
    dragOverIndex = null;
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
    history.snapshot();
  }

  function removeColourFromInput(index) {
    const newColours = [...parsedColours];
    newColours.splice(index, 1);
    inputValue = newColours.join(', ');
    history.snapshot();
  }


  function getSVG() {
    if (!svgRef) return;
    // Serialize the SVG node to a string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgRef);
    return svgString;
  }
  

   
  function showToast(e, message) {
    hideTooltip();
    toastEvent = e;
    clipboardMessage = message;
    toastOn = true;
    setTimeout(() => { toastOn = false; }, 1400);
  }

  async function copyToClipboard(text, e, type="") {
    hideTooltip();
    let result = await copyToClipboardCall(text);
    showToast(e, result.success ? type + ' copied to clipboard' : 'Failed to copy to clipboard.');
  }

  function reverseColours(e) {
    hideTooltip();
    // Split on commas or newlines, trim, filter out empty, reverse, and join with commas
    const reversed = inputValue
      .split(/[;,]+/)
      .map(s => s.trim())
      .filter(Boolean)
      .reverse()
      .join(', ');
    inputValue = reversed;
    history.snapshot();
    showToast(e, 'Input reversed');
  }

  function cleanColours(e) {
    inputValue = parsedColours.toString().replace(/,/g, ", ");
    history.snapshot();
    showToast(e, 'Input cleaned');
  }

  function spaceToComma() {
    const commas = inputValue.replace(/\s+/g, ',');
    inputValue = commas;
    history.snapshot();
  }

  function applyTailwindify(e) {
    const newInput = tailwindifyInput(parsedColours);
    inputValue = newInput;
    history.snapshot();
    showToast(e, 'Input extended');

    // transformedColours = tailwindify(parsedColours);
  }

  function clearInput(e) {
    inputValue = '';
    history.snapshot();
    showToast(e, 'Input cleared');
  }

</script>

<svelte:window onkeydown={handleKeydown} />

<div class="container" class:dark={blackBackground} style="--sel-background: {backgroundColor}">

  <div class="box">
    <div class="row">
      <h2>Inputs</h2>
      <div class="button-section">
        <button 
          onclick={(e) => cleanColours(e)}
          onmouseenter={(e) => showTooltip(e, "clean input format")}
          onmouseleave={hideTooltip}
        >clean</button>
        <button 
          onclick={(e) => reverseColours(e)}
          onmouseenter={(e) => showTooltip(e, "reverse input order")}
          onmouseleave={hideTooltip}
        >reverse</button>
        <!-- <button onclick={spaceToComma}>delimit</button> -->
        <button 
          onclick={(e) => applyTailwindify(e)}
          onmouseenter={(e) => showTooltip(e, "extend input colors")}
          onmouseleave={hideTooltip}
        >extend</button>
        <button 
          onclick={(e) => clearInput(e)}
          onmouseenter={(e) => showTooltip(e, "clear all inputs")}
          onmouseleave={hideTooltip}
        >clear</button>
        <button 
          onclick={(e) => copyToClipboard(inputCssValue, e, "CSS")} 
          class="desktop-only"
          onmouseenter={(e) => showTooltip(e, "copy input as CSS")}
          onmouseleave={hideTooltip}
        ><CssIcon height={20} width={20}/></button>
        <button 
          onclick={(e) => copyToClipboard(inputFigmaValue, e, "Figma import")} 
          class="desktop-only"
          onmouseenter={(e) => showTooltip(e, "copy input for Figma<br>bulk style creator plugin")}
          onmouseleave={hideTooltip}
        ><FigmaIcon height={20} width={20} /></button>
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
        oninput={() => history.snapshotDebounced()}
      />
    </div>



    <div 
      class="swatch-row"
      role="group"
      ondragover={(e) => e.preventDefault()}
      ondrop={(e) => handleDrop(e, dragOverIndex)}
    >
        {#each parsedColours as colour, i}
          <div
            role="group"
            draggable={true}
            ondragstart={(e) => handleDragStart(e, i)}
            ondrop={(e) => handleDrop(e, i)}
            ondragover={(e) => handleDragOver(e, i)}
            ondragend={handleDragEnd}
            style="cursor: grab; position: relative; border-radius: 8px; opacity: 0.999"
          >
            {#if draggingIndex !== null && dragOverIndex === i && draggingIndex !== i}
               <div class="drag-indicator" class:left={draggingIndex > i} class:right={draggingIndex < i}></div>
            {/if}
            <Swatch 
              {colour} 
              name={colour} 
              x={i*72} 
              width={68} 
              div={true} 
              onchange={(newHex) => inputValue = updateInputColour(inputValue, i, newHex)} 
              onremove={draggingIndex === null ? () => removeColourFromInput(i) : undefined}
            />
          </div>
        {/each}
    </div>
  </div>

  <div class="box">
    <div class="row">
      <h2>Configuration</h2>

      <div style="display: flex; flex-direction: row; align-items: center; gap: 10px; width: 100%; max-width: 250px;">
        <label for="name-input" class="small-label desktop-only" style="white-space: nowrap">export name</label>
        <input
          id="name-input"
          type="text"
          bind:value={inputName}
          placeholder={colourNameSuggestion}
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
        />  
      </div>

    </div>
  </div>

  <div class="box">
    <div class="row">
      <h2>Results</h2>
      <div class="group-of-buttons-w-label">
        <div class="small-label desktop-only">export</div>
        <div class="button-section">
          <button 
            onclick={(e) => copyToClipboard("['" + transformedColours.toString().replace(/,/g, "', '") + "']",e, "Array")}
            onmouseenter={(e) => showTooltip(e, "copy as JS Array")}
            onmouseleave={hideTooltip}
          ><ArrayIcon height={20} width={20} /></button>
          <button 
            onclick={(e) => copyToClipboard(outputCssValue, e, "CSS")}
            onmouseenter={(e) => showTooltip(e, "copy as CSS")}
            onmouseleave={hideTooltip}
          ><CssIcon height={20} width={20} /></button>
          <button 
            onclick={(e) => copyToClipboard(getSVG(), e, "SVG")}
            onmouseenter={(e) => showTooltip(e, "copy as SVG")}
            onmouseleave={hideTooltip}
          ><SvgIcon height={20} width={20} /></button>
          <button 
            onclick={(e) => copyToClipboard(outputFigmaValue, e, "Figma import")}
            onmouseenter={(e) => showTooltip(e, "copy for Figma<br>bulk style creator plugin")}
            onmouseleave={hideTooltip}
          ><FigmaIcon height={20} width={20} /></button>
          <button 
            onclick={(e) => copyToClipboard(generateUrl({
              inputValue,
              numColours,
              colorSpace,
              correctLightness,
              blackBackground,
              keepOriginal,
              stepwise,
              inputName
            }), e, "current settings link")} 
            onmouseenter={(e) => showTooltip(e, "copy link to current settings")}
            onmouseleave={hideTooltip}
          ><LinkIcon /></button>
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
          curve="stepAfter"
        />
      </div>
    {:else if resultsView === 'blindness'}
      
      <ColourTests 
        colours={transformedColours} 
        bind:warn={colourBlindWarn} 
        onhover={(e, text) => {
          if (e && text) showTooltip(e, text);
          else hideTooltip();
        }}
      />

    {:else if resultsView === 'viz'}
      <div class="viz-examples" style={createSampleColours(transformedColours, blackBackground)}>
        <SampleMap />
        <SampleArea />
        <SampleChord />
        <SampleBar />
      </div>

    {:else if resultsView === 'ui'}
      <div class="viz-examples" style={createSampleColours(transformedColours, blackBackground)}>
        <SampleTrend />
        <SampleChonk />
        <SampleIcons />
        <SampleClock />
      </div>

    {:else if resultsView === 'contrast'}
      <ContrastRatios colours={transformedColours} />

    {:else if resultsView === 'plot'}
      <ColourPlot colours={transformedColours} colorSpace={colorSpace} />

    {:else if resultsView === 'credits'}
      <div class="credits">
        <p>Gregor Aisch's <a href="https://gka.github.io/palettes" target="_blank" >Color Palette Helper</a> inspired this tool and his <a href="https://gka.github.io/chroma.js/" target="_blank" rel="noopener noreferrer">Chroma.js</a> powers it.</p>
        <p>Single colour palette generation intialized with Brian Wendt's <a href="https://github.com/wendtcode/uicolors-generator" target="_blank" rel="noopener noreferrer">UI Colors Generator</a></p>
        <p>Colour blindness simulation adapted from the function by Matthew Wickline and the <a href="http://hcirn.com/" target="_blank" rel="noopener noreferrer">HCIRN</a>.</p>
        <p>Some sample visuals created with <a href="https://rawgraphs.io/" target="_blank" rel="noopener noreferrer">RawGraphs</a></p>
        <p>Squirrel photo by <a href="https://unsplash.com/@sparrow24?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText" target="_blank" rel="noopener noreferrer">Włodzimierz Jaworski</a> on <a href="https://unsplash.com/photos/brown-squirrel-on-brown-dried-leaves-during-daytime-NPm7lIxltP8?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText" target="_blank">Unsplash</a></p>
        <p>Animated clock based on this <a href="https://svelte.dev/playground/270e83f43e7a48918d8f2d497760904f?version=3.32.1" target="_blank" rel="noopener noreferrer">Svelte Playground</a></p>
      </div>
    {/if}



    <div style="display: flex; align-items: center; justify-content: center;">
      <ButtonGroup bind:selected={resultsView} options={resultsViews} stack={false} --max-width="150px" --min-width="120px" --icon-size="14px" />
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

{#if hoverTooltipEvent}
  <div class="hover-tooltip-wrapper" transition:fade={{ duration: 100 }}>
    <Tooltip mouseEvent={hoverTooltipEvent} centered={true} yOffset={-6}>
      <div class="hover-tip-text">
        {@html hoverTooltipText}
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

  .credits {
    min-height: 200px;
    box-shadow: 0 0 0 1px var(--app-50), 0 10px 15px -3px rgba(0, 0, 0, .05), 0 4px 6px -4px rgba(0, 0, 0, .05);
    padding: 26px 24px;
    border-radius: 8px;
  }
  .credits p {
    font-size: 0.875rem;
    color: var(--grey-700);
    margin-bottom: 8px;
  }


  .row {
    display: flex;
    column-gap: 12px;
    row-gap: 10px;
    align-items: center;
  }

  .row.bottom-align {
    align-items: flex-end;
    justify-content: space-between;
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

  .num-input {
    width: 100%;
    max-width: 100px;
    min-width: 60px;
  }

  #num-colours {
    width: 100%;
  }

  #name-input {
    width: 100%;
    max-width: 174px;
    min-width: 60px;
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

  .drag-indicator {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background-color: var(--app-900);
    z-index: 20;
    pointer-events: none;
  }
  .drag-indicator.left {
    left: -4px;
  }
  .drag-indicator.right {
    right: -4px;
  }

  .hover-tooltip-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    pointer-events: none;
    z-index: 100;
  }

  .hover-tip-text {
    border-radius: 6px;
    background-color: white;
    color: var(--app-800);
    padding: 6px 10px;
    font-size: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    border: 1px solid var(--app-100);
    max-width: 200px;
  }

  .viz-examples {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: end;
  }

  @media (max-width: 900px) {
  .viz-examples {
    justify-content: start; 
    gap: 16px; /* Cap the gap */
  }
}


</style>