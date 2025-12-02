<script>
  import chroma from "chroma-js";

	const { 
    colour = 'grey',
    name = 'grey',
    x = 0,
    width = 84,
    div = false,
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

</script>

{#if !div}
  <g>
    <rect {x} {width} height={100} fill={colour} rx="8" />
    <text x="{x + width/2}" y="55" font-weight="bold" font-size="12" fill={getTextColor(colour)} text-anchor="middle">{name}</text>
    <text x="{x + width/2}" y={"70"} font-size="12" fill={getTextColor(colour)} text-anchor="middle">{colour.replace('#', '').toUpperCase()}</text>
  </g>
{:else}
  <div class="swatch" style="background-color: {colour}; color: {getTextColor(colour)}; width: {width}px;">
    {name}
  </div>
{/if} 

<style>
  .swatch {
    height: 32px;
    border-radius: 8px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    padding-top: 2px;
  }
</style>