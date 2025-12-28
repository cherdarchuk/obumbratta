<script>
  import chroma from 'chroma-js';

  let { colours = [], colorSpace = 'lch' } = $props();

  let plotPoints = $state([]);
  let plotWidth = $state(1000);

  function getLightness(colour, space) {
    const c = chroma(colour);
    if (space === 'lch') return c.lch()[0];
    if (space === 'oklch') return c.oklch()[0] * 100;
    if (space === 'lab') return c.lab()[0];
    if (space === 'hsv') return c.hsv()[2] * 100;
    if (space === 'rgb') return c.rgb()[0] / 255 * 100;
    if (space === 'oklab') return c.oklab()[0] * 100;
    return c.hsl()[2] * 100;
  }

  function getHue(colour, space) {
    const c = chroma(colour);
    if (space === 'lch') return c.lch()[2];
    if (space === 'oklch') return c.oklch()[2];
    if (space === 'lab') return (Math.atan2(c.lab()[2], c.lab()[1]) * 180 / Math.PI + 360) % 360;
    if (space === 'hsv') return c.hsv()[0];
    if (space === 'rgb') return c.rgb()[1] / 255 * 359;
    if (space === 'oklab') return (Math.atan2(c.oklab()[2], c.oklab()[1]) * 180 / Math.PI + 360) % 360;
    return c.hsl()[0];
  }

  function getSat(colour, space) {
    const c = chroma(colour);
    if (space === 'lch') return c.lch()[1];
    if (space === 'oklch') return c.oklch()[1] * 100; 
    if (space === 'lab' || space === 'lab-bezier') return Math.sqrt(c.lab()[1] ** 2 + c.lab()[2] ** 2);
    if (space === 'hsv') return c.hsv()[1] * 100;
    if (space === 'rgb') return c.rgb()[2] / 255 * 100;
    if (space === 'oklab') return Math.sqrt(c.oklab()[1] ** 2 + c.oklab()[2] ** 2);


    return c.hsl()[1] * 100;
  }

  let canvas;

  $effect(() => {
    if (!canvas || colours.length < 2) return;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(200, 40);
    const data = imageData.data;

    const numColours = colours.length;
    const startHue = getHue(colours[0], colorSpace);
    const nextHue = getHue(colours[1], colorSpace);
    
    // Calculate distances to determine direction
    const shiftedNext = (nextHue - startHue + 360) % 360;
    const x_forward = (shiftedNext / 360) * 1000;
    const x_reverse = ((startHue - nextHue + 360) % 360 / 360) * 1000;
    
    // Determines if we should plot backwards
    const reverse = x_reverse < x_forward;
    
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
      if (shiftedHue < sortedShiftedHues[0]) {
        satArray[x] = getSat(sortedColours[0], colorSpace);
      } else if (shiftedHue >= sortedShiftedHues[numColours - 1]) {
        satArray[x] = getSat(sortedColours[numColours - 1], colorSpace);
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

<div class="colour-plot" bind:clientWidth={plotWidth} style="width: 100%;">
  <canvas bind:this={canvas} width="200" height="40" style="border: 1px solid var(--grey-50); width: {plotWidth}px; height: {plotWidth / 5}px;"></canvas>
  <svg width={plotWidth} height={plotWidth / 5} style="position: absolute; top: 0; left: 0; pointer-events: none;">
    {#each plotPoints as point}
      <circle cx={point.x} cy={point.y} r="6" fill={point.colour} stroke="black" stroke-width="4" />
      <circle cx={point.x} cy={point.y} r="6" fill="none" stroke="white" stroke-width="2" />
    {/each}
  </svg>
  {#if colours.length === 0}
    <p>No colours to plot</p>
  {/if}
</div>

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
</style>