// Function to generate a URL with query parameters based on appState and optional advanced filters
export const generateUrl = (stateObject = {}) => {
  const baseUrl = window.location.origin + window.location.pathname;
  const params = new URLSearchParams();

  // Loop through each property in appState
  for (const [key, value] of Object.entries(stateObject)) {
    // Skip complex objects and empty values
    if (value && typeof value !== 'object' && value !== '') {
      params.set(key, value);
    }
  }

  return `${baseUrl}?${params.toString()}`;
};

// Put this in the root +layout.svelte or +page.svelte to read URL parameters on load
// assumes `appState` contains the relevant properties, change if needed
//
// import { onMount } from 'svelte';
// import { page } from '$app/state';
//
// // Handle URL parameters on initial load
// onMount(() => {
//   const params = page.url.searchParams;
//   // Loop through all URL parameters and update appState if the property exists
//   for (const [key, value] of params.entries()) {
//     if (key in appState && typeof appState[key] !== 'object') {
//       appState[key] = value;
//     }
//   }
// });
