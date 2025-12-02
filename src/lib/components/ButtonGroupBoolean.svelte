<script>
  import ButtonGroup from "$lib/components/ButtonGroup.svelte";

let { 
    value = $bindable(false), 
    label = '',
  } = $props();

  
  
</script>

<ButtonGroup 
  bind:selected={value} 
  {label}
  options={[
    { label: 'ON', value: true },
    { label: 'OFF', value: false }
  ]}
  labelAbove=true
/>
