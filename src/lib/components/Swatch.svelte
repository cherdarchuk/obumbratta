<script>

	const { 
    colour = '#777777',
    name = 'XX',
    x = 0,
  } = $props();

  function getTextColor(bg) {
  // Accepts hex (#abc, #aabbcc), rgb(), or named colors
  let r, g, b;

  // Hex
  if (bg[0] === '#') {
    let hex = bg.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(x => x + x).join('');
    }
    if (hex.length === 6) {
      r = parseInt(hex.slice(0,2), 16);
      g = parseInt(hex.slice(2,4), 16);
      b = parseInt(hex.slice(4,6), 16);
    }
  }
  // rgb()
  else if (bg.startsWith('rgb')) {
    const nums = bg.match(/\d+/g);
    if (nums && nums.length >= 3) {
      r = +nums[0];
      g = +nums[1];
      b = +nums[2];
    }
  }
  // fallback for named colors (just use white text)
  else {
    return 'white';
  }

  // If we got RGB, use luminance formula
  if (r !== undefined && g !== undefined && b !== undefined) {
    // Perceived luminance
    const luminance = 0.299*r + 0.587*g + 0.114*b;
    return luminance > 150 ? 'black' : 'white';
  }
  return 'white';
}

</script>

<g>
  <rect {x} width="84" height="100" fill={colour} rx="8" />
  <text x="{x + 84/2}" y="55" font-size="12" fill={getTextColor(colour)} text-anchor="middle">{colour}</text>
  <text x="{x + 84/2}" y="70" font-weight="bold" font-size="12" fill={getTextColor(colour)} text-anchor="middle">{name}</text>
</g>