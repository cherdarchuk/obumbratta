<script>
  import chroma from "chroma-js";
  import CheckIcon from '~icons/mdi/check-circle';
  import AsteriskIcon from '~icons/mynaui/asterisk-diamond-solid';
  import AlertIcon from '~icons/mingcute/alert-fill';
  
	const { 
    backColour = '#ffffff',
    foreColour = '#000000',
    x = 0,
    width = 84,
  } = $props();

  function getTextColor(backgroundColor) {
    const contrastBlack = chroma.contrast(backgroundColor, 'black');
    const contrastWhite = chroma.contrast(backgroundColor, 'white');

    if (contrastBlack > contrastWhite) {
      return 'black';
    } else {
      return 'white';
    }
  }
  
  let contrastVal = $derived(chroma.contrast(backColour, foreColour).toFixed(1));

</script>

<a href="https://color.review/check/{foreColour.slice(1)}-{backColour.slice(1)}" target="_blank" rel="noopener noreferrer">
<g class="swatch-contrast">
  {#if contrastVal >= 3}
    <rect x={x} {width} height={36} fill={backColour} rx="8" stroke-width="0.5" stroke="#777777"/>  
    <text x="{x + 10}" y={24} font-size="18" font-weight="700" fill={foreColour} text-anchor="start">{contrastVal}</text>
    {#if contrastVal >= 4.5}
     <CheckIcon width={20} x={x + width - 30} y={8} color={foreColour} />
    {:else}  
      <AsteriskIcon width={21} x={x + width - 30} y={8} color={foreColour} />
    {/if}
  {:else}
    <rect x={x + 7} y={9} width={20} height={18} fill={backColour} rx="6" stroke-width="0.5" stroke="#777777"/>  
    <text x="{x + 10}" y={"22"} font-weight="700" font-size="10" fill={foreColour} text-anchor="start">{contrastVal}</text>
    <text x="{x + 33}" y={"22"} font-size="10" fill='var(--app-900)' text-anchor="start">{contrastVal}</text>
    <AlertIcon width={20} x={x + width - 30} y={8} color='var(--app-500)' />
  {/if}
  
</g>
</a>


<style>
  


</style>