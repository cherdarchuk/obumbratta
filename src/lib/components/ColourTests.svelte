<script>
  import Swatch from '$lib/components/Swatch.svelte';
  import { getSimulatedColors, isColorBlindSafe } from '$lib/helpers/colorBlind.js';

  let {
    colours = [],
    onhover,
  } = $props()



  let colourBlindnessTypes = $derived(
    [
      { label: 'deutan', value: 'deuteranopia', detail: 'green blind ~6.5% of males, ~0.41% of females' },
      { label: 'protan', value: 'protanopia', detail: 'red blind ~2% of males, ~0.02% of females' },
      { label: 'tritan', value: 'tritanopia', detail: 'blue blind <0.01% of males and females' },
    ]
  );


</script>

{#each colourBlindnessTypes as { label, value, detail }}
  {@const simulatedColours = getSimulatedColors(colours, value)}
  {@const problems = isColorBlindSafe(colours, value)}
  <h3><b>{label}</b> {detail}</h3>
  <svg viewBox="0 0 1000 36" xmlns="http://www.w3.org/2000/svg">
    {#each simulatedColours as colour, i}
      <Swatch 
        {colour} 
        x={i*Math.min(15000, 1006/colours.length)} 
        width={Math.min(15000,1006/colours.length - 6)} 
        short={true}
        warn = {problems.includes(colour)}
        onwarnhover={(e) => {
          if (e) onhover?.(e, "Colours are significantly more similar than their counterparts");
          else onhover?.(null);
        }}
      />
    {/each}
  </svg>
{/each}
    <a href="https://www.ncbi.nlm.nih.gov/books/NBK11538/table/ch28kallcolor.T1/" target="_blank" rel="noopener noreferrer">
      source
    </a>

<style>
  h3 {
    text-align: center;
    font-size: 12px;
    color: var(--app-800);
    line-height: 1em;
    margin-top: 3px;
  }
  a {
    font-size: 10px;
    color: var(--app-500);
    text-align: center;
    display: block;
    text-decoration: underline;
  }
</style>