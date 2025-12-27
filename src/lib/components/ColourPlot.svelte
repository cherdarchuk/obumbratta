<script>
  import chroma from 'chroma-js';

  let { colours = [], colorSpace = 'lch' } = $props();

  function getLightness(colour, space) {
    const c = chroma(colour);
    return c.lab()[0]; // always use perceptual lightness
  }

  function getHue(colour, space) {
    const c = chroma(colour);
    return c.hsl()[0]; // always use hsl hue
  }

  function getSat(colour, space) {
    const c = chroma(colour);
    return c.hsl()[1] * 100; // always use hsl saturation
  }

  let canvas;

  $effect(() => {
    if (!canvas || colours.length < 2) return;
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(1000, 200);
    const data = imageData.data;

    const numColours = colours.length;

    for (let y = 0; y < 200; y++) {
      const lightness = (199 - y) / 199 * 100;
      for (let x = 0; x < 1000; x++) {
        const t = x / 999;
        const index = Math.min(Math.floor(t * (numColours - 1)), numColours - 2);
        const frac = (t * (numColours - 1)) - index;
        const hue1 = getHue(colours[index], colorSpace);
        let hue2 = getHue(colours[index + 1], colorSpace);
        const sat1 = getSat(colours[index], colorSpace);
        const sat2 = getSat(colours[index + 1], colorSpace);
        
        // Adjust hue2 to take the shortest path
        const hueDiff = hue2 - hue1;
        if (hueDiff > 180) hue2 -= 360;
        else if (hueDiff < -180) hue2 += 360;
        
        const hue = ((hue1 + frac * (hue2 - hue1)) % 360 + 360) % 360;
        const sat = sat1 + frac * (sat2 - sat1);
        const colour = chroma.hsl(hue, sat / 100, lightness / 100);
        const rgb = colour.rgb();
        const pixelIndex = (y * 1000 + x) * 4;
        data[pixelIndex] = rgb[0];
        data[pixelIndex + 1] = rgb[1];
        data[pixelIndex + 2] = rgb[2];
        data[pixelIndex + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);

    // Draw the colour points
    colours.forEach((colour, i) => {
      const t = i / (numColours - 1);
      const x = t * 1000;
      const lightness = getLightness(colour, colorSpace);
      const y = (100 - lightness) / 100 * 200;
      ctx.fillStyle = colour;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  });
</script>

<div class="colour-plot">
  <canvas bind:this={canvas} width="1000" height="200" style="border: 1px solid var(--grey-50);"></canvas>
  {#if colours.length === 0}
    <p>No colours to plot</p>
  {/if}
</div>

<style>
  .colour-plot {
    padding: 20px;
    text-align: center;
  }

  h3 {
    margin: 0 0 10px 0;
    color: var(--viz-17);
  }

  canvas {
    background: var(--grey-5);
  }

  p {
    margin: 10px 0 0 0;
    color: var(--viz-12);
  }
</style>