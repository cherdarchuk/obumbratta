<script>
  import chroma from 'chroma-js';
  import { fade } from 'svelte/transition';
  import Tooltip from '$lib/components/Tooltip.svelte';

  let { colours = [], colorSpace = 'lch' } = $props();

  let plotPoints = $state([]);
  let plotWidth = $state(1000);
  let tooltipOn = $state(false);
  let tooltipEvent = $state(null);
  let tooltipMessage = $state('');

  function getLightness(colour, space) {
    const c = chroma(colour);
    if (space === 'lch') return c.lch()[0] || 0;
    if (space === 'oklch') return (c.oklch()?.[0] || 0) * 100;
    if (space === 'lab') return c.lab()[0] || 0;
    if (space === 'hsv') return c.hsv()[2] * 100;
    if (space === 'rgb') return c.rgb()[0] / 255 * 100;
    if (space === 'oklab') return (c.oklab()?.[0] || 0) * 100;
    return c.hsl()[2] * 100;
  }

  function getHue(colour, space) {
    const c = chroma(colour);
    let hue;
    if (space === 'lch') hue = c.lch()[2];
    else if (space === 'oklch') hue = c.oklch()[2];
    else if (space === 'lab') hue = (Math.atan2(c.lab()[2], c.lab()[1]) * 180 / Math.PI + 360) % 360;
    else if (space === 'hsv') hue = c.hsv()[0];
    else if (space === 'rgb') hue = c.rgb()[1] / 255 * 359;
    else if (space === 'oklab') hue = (Math.atan2(c.oklab()[2], c.oklab()[1]) * 180 / Math.PI + 360) % 360;
    else hue = c.hsl()[0];
    
    // Handle achromatic colors where hue is NaN
    return isNaN(hue) ? 0 : hue;
  }

  function getSat(colour, space) {
    const c = chroma(colour);
    if (space === 'lch') return c.lch()[1] || 0;
    if (space === 'oklch') return (c.oklch()?.[1] || 0) * 100;
    if (space === 'lab' || space === 'lab-bezier') return Math.sqrt(c.lab()[1] ** 2 + c.lab()[2] ** 2);
    if (space === 'hsv') return c.hsv()[1] * 100;
    if (space === 'rgb') return c.rgb()[2] / 255 * 100;
    if (space === 'oklab') return Math.sqrt(c.oklab()[1] ** 2 + c.oklab()[2] ** 2);
    return c.hsl()[1] * 100;
  }

  let canvas;

  function handleClick(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Scale to internal canvas coordinates (200x40)
    const internalX = Math.floor(x / (plotWidth / 200));
    const internalY = Math.floor(y / ((plotWidth / 5) / 40));
    
    if (internalX >= 0 && internalX < 200 && internalY >= 0 && internalY < 40) {
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, 200, 40);
      const data = imageData.data;
      const index = (internalY * 200 + internalX) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const hex = chroma.rgb(r, g, b).hex();
      
      navigator.clipboard.writeText(hex).then(() => {
        tooltipEvent = event;
        tooltipMessage = `${hex} copied to clipboard`;
        tooltipOn = true;
        setTimeout(() => { tooltipOn = false; }, 1400);
      }).catch(err => {
        console.error('Failed to copy:', err);
      });
    }
  }

  $effect(() => {
    if (!canvas || colours.length < 2) return;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(200, 40);
    const data = imageData.data;

    const numColours = colours.length;
    let startHue = getHue(colours[0], colorSpace);
    const nextHue = getHue(colours[1], colorSpace);
    

    
    // Calculate distances to determine direction
    const shiftedNext = (nextHue - startHue + 360) % 360;
    const x_forward = (shiftedNext / 360) * 1000;
    const x_reverse = ((startHue - nextHue + 360) % 360 / 360) * 1000;
    
    // Determines if we should plot backwards
    const reverse = x_reverse < x_forward;
    
    // Adjust startHue based on reverse mode
    if (reverse) {
      startHue = (startHue + 10) % 360;
    }
    else {
      startHue = (startHue + 350) % 360;
    }
    if (colorSpace === 'rgb') {
      startHue = 359.5;
    } 
    
    const sortedColours = [...colours].sort((a, b) => {
      const aHue = (getHue(a, colorSpace) - startHue + 360) % 360;
      const bHue = (getHue(b, colorSpace) - startHue + 360) % 360;
      return aHue - bHue;
    });

    // 1. Precompute saturation (Your existing logic was correct here)
    const satArray = new Array(200);
    for (let x = 0; x < 200; x++) {
      const hue = reverse 
        ? (startHue - (x / 199) * 360 + 360) % 360 
        : (startHue + (x / 199) * 360) % 360;
        
      const shiftedHue = (hue - startHue + 360) % 360;
      
      const sortedShiftedHues = sortedColours.map(c => (getHue(c, colorSpace) - startHue + 360) % 360);
      const firstSat = getSat(sortedColours[0], colorSpace);
      const lastSat = getSat(sortedColours[numColours - 1], colorSpace);
      
      let leftSat, rightSat;
      // if (colorSpace === 'rgb') {
        leftSat = firstSat;
        rightSat = lastSat;
      // } else {
      //   leftSat = getSat((firstSat+lastSat)/2, colorSpace);
      //   rightSat = getSat((firstSat+lastSat)/2, colorSpace);
      // }
      
      if (shiftedHue < sortedShiftedHues[0]) {
        satArray[x] = leftSat;
      } else if (shiftedHue >= sortedShiftedHues[numColours - 1]) {
        satArray[x] = rightSat;
      } else {
        let index = 0;
        for (; index < numColours - 1; index++) {
          if (sortedShiftedHues[index] <= shiftedHue && shiftedHue < sortedShiftedHues[index + 1]) break;
        }
        const sat1 = getSat(sortedColours[index], colorSpace);
        const sat2 = getSat(sortedColours[index + 1], colorSpace);
        const frac = (shiftedHue - sortedShiftedHues[index]) / (sortedShiftedHues[index + 1] - sortedShiftedHues[index]);
        satArray[x] = sat1 + frac * (sat2 - sat1);
      }
    }

    // 2. Draw Pixels (UPDATED to respect reverse)
    for (let y = 0; y < 40; y++) {
      const lightness = (39 - y) / 39 * 100;
      for (let x = 0; x < 200; x++) {
        // FIX: Calculate hue using the same reverse logic as satArray
        const hue = reverse 
          ? (startHue - (x / 199) * 360 + 360) % 360 
          : (startHue + (x / 199) * 360) % 360;

        const sat = satArray[x];
        
        const colour = colorSpace === 'lch' ? chroma.lch(lightness, sat, hue) :
                      colorSpace === 'oklch' ? chroma.oklch(lightness / 100, sat / 100, hue) :
                      colorSpace === 'lab' ? chroma.lab(lightness, sat * Math.cos(hue * Math.PI / 180), sat * Math.sin(hue * Math.PI / 180)) :
                      colorSpace === 'hsv' ? chroma.hsv(hue, sat / 100, lightness / 100) :
                      colorSpace === 'rgb' ? chroma.rgb(lightness / 100 * 255, hue / 360 * 255, sat / 100 * 255) :
                      colorSpace === 'oklab' ? chroma.oklab(lightness / 100, sat * Math.cos(hue * Math.PI / 180), sat * Math.sin(hue * Math.PI / 180)) :
                      chroma.hsl(hue, sat / 100, lightness / 100);
        const rgb = colour.rgb();
        const pixelIndex = (y * 200 + x) * 4;
        data[pixelIndex] = rgb[0];
        data[pixelIndex + 1] = rgb[1];
        data[pixelIndex + 2] = rgb[2];
        data[pixelIndex + 3] = 255;

      }
    }
    ctx.putImageData(imageData, 0, 0);

    // 3. Compute plot points (UPDATED to respect reverse)
    plotPoints = colours.map(colour => {
      const hue = getHue(colour, colorSpace);
      
      // FIX: Calculate distance based on direction
      // If reverse, we calculate distance going "backwards" from start
      const hueDelta = reverse 
        ? (startHue - hue + 360) % 360
        : (hue - startHue + 360) % 360;

      const lightness = getLightness(colour, colorSpace);
      
      const x = (hueDelta / 360) * plotWidth; // display coordinates
      const y = (100 - lightness) / 100 * (plotWidth / 5);
      return { x, y, colour };
    });
  });
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="colour-plot" bind:clientWidth={plotWidth} style="width: 100%;" onclick={handleClick}>
  <canvas bind:this={canvas} width="200" height="40" style="border: 1px solid var(--grey-50); width: {plotWidth}px; height: {plotWidth / 5}px;"></canvas>
  <svg width={plotWidth} height={plotWidth / 5} style="position: absolute; top: 0; left: 0; pointer-events: none;">
    {#each plotPoints as point}
      <circle cx={point.x} cy={point.y} r="6" fill={point.colour} stroke="black" stroke-width="4" />
      <circle cx={point.x} cy={point.y} r="6" fill="none" stroke="white" stroke-width="2" />
      <!-- <text x={point.x} y={point.y + 20} text-anchor="middle" font-size="10" fill="black">
        {getHue(point.colour, colorSpace).toFixed(0)}°
      </text> -->
    {/each}
  </svg>
  {#if colours.length === 0}
    <p>No colours to plot</p>
  {/if}
</div>

{#if tooltipOn && tooltipEvent}
  <div class="toast-wrapper" transition:fade={{ duration: 200 }}>
    <Tooltip mouseEvent={tooltipEvent} centered={true}>
      <div class="tip-text">
        {tooltipMessage}
      </div>
    </Tooltip>
  </div>
{/if}

<style>
  .colour-plot {
    padding: 0px;
    position: relative;
  }

  svg {
    overflow: visible;
  }

  canvas {
    background: var(--grey-5);
  }

  .toast-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1000;
  }

  .tip-text {
    border-radius: 6px;
    background-color: white;
    color: var(--grey-800);
    padding: 6px 10px;
    font-size: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    border: 1px solid var(--grey-100);
  }
</style>