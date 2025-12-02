<script>
  import { Label, RadioGroup } from "bits-ui";

let { 
    value = $bindable(false), 
    label = '',
  } = $props();

  // Toggle function - clicking either button flips the value
  function toggle() {
    value = !value;
  }
  
</script>

<div class="container">
  {#if label}
    <Label.Root class="toggle-label">{label}</Label.Root>
  {/if}

  <div class="button-group">
    <button 
      class="toggle-btn {value === true ? 'active' : ''}"
      onclick={toggle}
    >
      ON
    </button>
    <button 
      class="toggle-btn {value === false ? 'active' : ''}"
      onclick={toggle}
    >
      OFF
    </button>
  </div>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  :global(.toggle-label) {
    font-size: 12px;
    color: var(--brown-500);
    width: 80px;

  }

  .button-group {
    display: flex;
    gap: 0px;
  }

 .toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--app-700);
    padding-top: 2px;
    border: 1px solid var(--app-100);
    background-color: var(--app-50);
    height: 36px;
    font-size: 12px;
    letter-spacing: -0.5px;
    margin-right: -1px;
    min-width: 44px;
    cursor: pointer;
  }

  @media (max-width: 768px) {
  	.toggle-btn {
  		min-width: 36px;
  	}
  }

  .toggle-btn.active {
    background-color: var(--app-200);
    font-weight: bold;
    color: var(--app-900);
  }

  .toggle-btn:first-child {
    border-radius: 6px 0 0 6px;
  }

  .toggle-btn:last-child {
    border-radius: 0 6px 6px 0;
    margin-right: 0px;
  }
</style>
