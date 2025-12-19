<script>
  import chroma from "chroma-js";
  import WarnIcon from '~icons/material-symbols/warning-outline-rounded';

	const { 
    colour = 'grey',
    name = 'grey',
    x = 0,
    width = 84,
    div = false,
    oncopy,
    short = false,
    warn = false,
    onchange,
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
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <g onclick={(e) => { oncopy?.(colour, { target: e.currentTarget, clientX: e.clientX, clientY: e.clientY }, colour); }}>

    <rect {x} {width} height={short ? 36 : 100} fill={colour} rx="8" />
    {#if !short}
      <text x="{x + width/2}" y="55" font-weight="bold" font-size="12" fill={getTextColor(colour)} text-anchor="middle">{name}</text>
      <text x="{x + width/2}" y={"70"} font-size="12" fill={getTextColor(colour)} text-anchor="middle">{colour.replace('#', '').toUpperCase()}</text>
    <!-- {:else}
      <text x="{x + width/2}" y={"23"} font-size="12" fill={getTextColor(colour)} text-anchor="middle">{colour.replace('#', '').toUpperCase()}</text> -->
    {/if}
      
    
    {#if warn}
      <foreignObject x={x + width/2 - 12} y={2 + (short ? 40 : 100)/2 - 12} width="24" height="24">
        <WarnIcon width="24" height="20" color={getTextColor(colour)} />
      </foreignObject>
    {/if}
  </g>
{:else}
  <div class="swatch" style="background-color: {colour}; color: {getTextColor(colour)}; width: {width}px; position: relative;">
    {name}
    {#if onchange}
      <input 
        type="color" 
        value={chroma.valid(colour) ? chroma(colour).hex() : '#000000'} 
        oninput={(e) => onchange(e.target.value)} 
        onclick={(e) => e.stopPropagation()}
        style="opacity: 0; position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: pointer;" 
      />
    {/if}
  </div>
{/if}

<style>
  .swatch {
    height: 32px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    padding-top: 2px;
  }
</style>