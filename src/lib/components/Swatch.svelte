<script>
  import chroma from "chroma-js";
  import WarnIcon from '~icons/material-symbols/warning-outline-rounded';
  import CopyIcon from '~icons/mdi/content-copy';
  import InputIcon from '~icons/mdi/input';

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
    oninsert,
  } = $props();

  let isHovered = $state(false);
  let isShiftHeld = $state(false);

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

<svelte:window 
  onkeydown={(e) => { if (e.key === 'Shift') isShiftHeld = true; }} 
  onkeyup={(e) => { if (e.key === 'Shift') isShiftHeld = false; }} 
/>

{#if !div}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <g 
    class="swatch-interactive"
    onclick={(e) => { 
      if (e.shiftKey && oninsert) {
        oninsert(colour);
      } else {
        oncopy?.(colour, { target: e.currentTarget, clientX: e.clientX, clientY: e.clientY }, colour); 
      }
    }}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (e.shiftKey && oninsert) {
          oninsert(colour);
        } else {
          oncopy?.(colour, { target: e.currentTarget, clientX: 0, clientY: 0 }, colour);
        }
      }
    }}
    onmouseenter={() => isHovered = true}
    onmouseleave={() => isHovered = false}
    role="button"
    tabindex="0"
    style="cursor: pointer"
  >

    <rect {x} {width} height={short ? 36 : 100} fill={colour} rx="8" />
    {#if !short}
      <text x="{x + width/2}" y="60" font-weight="bold" font-size="12" fill={getTextColor(colour)} text-anchor="middle">{name}</text>
      <text x="{x + width/2}" y="75" font-size="12" fill={getTextColor(colour)} text-anchor="middle">{colour.replace('#', '').toUpperCase()}</text>
      
      {#if isHovered}
        {#if oninsert && isShiftHeld}
          <g 
            transform="translate({x + width/2 - 10 }, 15) rotate(270, 10, 10)" 
            opacity='0.3'
          >
            <InputIcon width="20" height="20" color={getTextColor(colour)} />
          </g>
        {:else}
          <g transform="translate({x + width/2 - 10}, 15)" opacity='0.3'>
            <CopyIcon width="20" height="20" color={getTextColor(colour)} />
          </g>
        {/if}
      {/if}
    <!-- {:else}
      <text x="{x + width/2}" y={"23"} font-size="12" fill={getTextColor(colour)} text-anchor="middle">{colour.replace('#', '').toUpperCase()}</text> -->
    {/if}
      
    
    {#if warn}
      <g transform="translate({x + width/2 - 12}, {(short ? 36 : 100)/2 - 12})">
        <WarnIcon width="24" height="24" color={getTextColor(colour)} />
      </g>
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
  .swatch-interactive:focus {
    outline: none;
  }

  .swatch-interactive:focus-visible {
    outline: auto;
  }

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