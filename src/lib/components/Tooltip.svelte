<script>

  let { 
    mouseEvent, 
    align = 'center', 
    fixToElement = true,
    xOffset = 0,
    yOffset = -6,
    screenPadding = 10,
    children 
  } = $props();

  let height = $state(0);
  let width = $state(0);

  let rect = $derived(mouseEvent.target.getBoundingClientRect());

  let left = $derived.by(() => {
    let tooltipLeft;
    let x;

    if (align === 'left') {
      x = fixToElement ? rect.left : mouseEvent.clientX;
      tooltipLeft = x + xOffset; 
    } else if (align === 'right') {
      x = fixToElement ? rect.right : mouseEvent.clientX;
      tooltipLeft = x - width + xOffset; 
    } else { // center
      x = fixToElement ? rect.left + rect.width / 2 : mouseEvent.clientX;
      tooltipLeft = x - (width * 0.5) + xOffset; 
    }
    
    // prevent tooltip from going off screen
    if (tooltipLeft < screenPadding) return screenPadding;
    if (tooltipLeft + width > window.innerWidth - screenPadding) {
      return window.innerWidth - width - screenPadding;
    }
    
    return tooltipLeft;
  });

  let top = $derived.by(() => {
    let y = fixToElement ? rect.top : mouseEvent.clientY;
    const tooltipTop = y - height + yOffset;
    
    // prevent tooltip from going off screen
    if (tooltipTop < screenPadding) return screenPadding;
    if (tooltipTop + height > window.innerHeight - screenPadding) {
      return window.innerHeight - height - screenPadding;
    }
    return tooltipTop;
  });


</script>

<div class='tooltip-container' 
  bind:clientHeight={height}
  bind:clientWidth={width}
  style="left: {left}px; top: {top}px;"
>
  {@render children()}
</div>

<style>
  .tooltip-container {
    position: fixed;
    z-index: 100;
    pointer-events: none;
  }

  /* global style for tooltips */
  :global(.tip-text) {
    border-radius: 4px;
    color: var(--grey-900);
    background-color: var(--grey-50);
    padding: 12px 10px;
    font-size: 10px;
  }

  /* Optional: Add a small arrow pointing down */
  /* :global(.tip-text::after) {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 4px solid transparent;
    border-top-color: var(--grey-800);
  } */
 
</style>