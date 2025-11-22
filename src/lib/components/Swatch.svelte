<script>
  import chroma from "chroma-js";

	const { 
    colour = 'grey',
    name = 'grey',
    x = 0,
    width = 84,
    short = false,
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

<g>
  <rect {x} {width} height={short ? "32" : "100"} fill={colour} rx="8" />
  <text x="{x + width/2}" y={short ? "20" : "55"} font-size="12" fill={getTextColor(colour)} text-anchor="middle">{colour}</text>
  {#if !short}
    <text x="{x + width/2}" y="70" font-weight="bold" font-size="12" fill={getTextColor(colour)} text-anchor="middle">{name}</text>
  {/if}
</g>