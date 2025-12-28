<script>
  import SwatchContrast from '$lib/components/SwatchContrast.svelte';
  import CheckIcon from '~icons/mdi/check-circle';
  import AsteriskIcon from '~icons/mynaui/asterisk-diamond-solid';
  import AlertIcon from '~icons/mingcute/alert-fill';

  let {
    colours = [],
  } = $props()

  let backgrounds = $derived(['#ffffff', colours[0], colours[colours.length -1], '#000000']);

</script>

<div class="container">
  {#each backgrounds as backColour}
    <svg viewBox="0 0 1000 36" xmlns="http://www.w3.org/2000/svg">
      {#each colours as colour, i}
        <SwatchContrast 
          foreColour={colour}
          backColour={backColour} 
          x={i*Math.min(15000, 1006/colours.length)} 
          width={Math.min(15000,1006/colours.length - 6)} 
        />
      {/each}
    </svg> 
  {/each} 
  <div class="legend">
    <div><CheckIcon/> <b>above 4.5</b> - good</div>
    <div><AsteriskIcon/> <b>above 3</b> - good for headlines and icons but not body text</div>
    <div><AlertIcon/> <b>below 3</b> - fails accesibility standards</div>
  </div> 
</div>
   

<style>
  .container {
    height: 200px;
  }
  .legend {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    font-size: 12px;
    color: var(--app-800);
    margin-top: 8px;
  }
  .legend div {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  :global(.legend svg) {
    margin-bottom: 3px;
    }
</style>