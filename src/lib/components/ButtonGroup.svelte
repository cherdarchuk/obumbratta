<script>
  import { Label, RadioGroup } from "bits-ui";

let { 
    selected = $bindable(''), 
    options = [],
    label = '',
    labelAbove = false
  } = $props();

  let btnGrpId = $derived(label ? label.replace(/\s+/g, '-').toLowerCase() : `btn-grp-${Math.random().toString(36).substr(2, 9)}`); 
  
</script>


<div class="container" class:label-above={labelAbove}>
  {#if label}
    <Label.Root 
      for={label} 
      class="btn-grp-label"
    >
      {@html label}
    </Label.Root>
  {/if}

  <RadioGroup.Root bind:value={selected} id={label} class="button-group" required>
    {#each options as option}
      <RadioGroup.Item 
        id={btnGrpId + option.value} 
        value={option.value} 
        class="grouped-btn  {selected === option.value ? 'active' : ''}"
      >
        <Label.Root 
          for={btnGrpId + option.value} 
          class="button-label"
        >
          {#if option.icon}
            <span style:font-size="7px">{@render option.icon({ class: "button-icon" })}</span>
          {/if}
          {option.label}
        </Label.Root>
      </RadioGroup.Item>
    {/each}
  </RadioGroup.Root>
</div>

<style>
  .container {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .container.label-above {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  :global(.btn-grp-label) {
    font-size: 12px;
    color: var(--app-500);
    width: 80px;
    text-align: right;
    /* white-space: nowrap; */
  }

  .container.label-above :global(.btn-grp-label) {
    text-align: left;
  }


  :global(.button-group) {
    display: flex;
    gap: 0px;
  }

  :global(.grouped-btn) {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--app-700);
    padding: 4px 10px 0px 10px;
    border: 1px solid var(--app-100);
    background-color: var(--app-50);
    height: 36px;
    font-size: 12px;
    letter-spacing: -0.5px;
    cursor: pointer;
    border-right: none;
  }

  :global(.grouped-btn.active) {
    background-color: var(--app-200);
    font-weight: bold;
    color: var(--app-900);
    padding-top: 5px;
  }

  :global(.grouped-btn:first-child) {
    border-radius: 6px 0 0 6px;
  }

  :global(.grouped-btn:last-child) {
    border-radius: 0 6px 6px 0;
    margin-right: 0px;
    border-right: 1px solid var(--app-100);
  }
</style>
