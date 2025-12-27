/**
 * Spread an array of colors across 20 CSS variables (--viz-1 to --viz-20).
 * If colors.length < 20, each color is assigned to a block of variables.
 * If colors.length > 20, only the first 20 are used.
 * Returns a string of CSS variable definitions.
 */
export function createSampleColours(colours, blackBackground = false) {
  const totalVars = 20;
  const result = [];
  let usedColours = [...colours];
  if (blackBackground) {
    usedColours.reverse();
  }
  const n = usedColours.length;
  if (n === 0) return '';
  // If more than 20, just use the first 20
  usedColours = n > totalVars ? usedColours.slice(0, totalVars) : usedColours;
  const blockSize = Math.floor(totalVars / usedColours.length);
  let remainder = totalVars % usedColours.length;
  let varIndex = 1;
  for (let i = 0; i < usedColours.length; i++) {
    let count = blockSize + (remainder > 0 ? 1 : 0);
    remainder--;
    for (let j = 0; j < count; j++) {
      result.push(`--viz-${varIndex}: ${usedColours[i]};`);
      varIndex++;
    }
  }
  return result.join('\n');
}
import chroma from 'chroma-js';
import { getTailwindColors } from "uicolors-generator";

export function interpolateColors(colours, options = {}) {
  const {
    numColours = 11,
    stepwise = false,
    colorSpace = 'lch',
    correctLightness = false,
    keepOriginal = false,
    divergingColour = ''
  } = options;

  let colourList = [...colours];
  let scale;
  let domainVals = [0,1];

  if (colours.length < 1) {
    return colourList;
  }
  else if (colours.length === 1) {
    const originalColour = colours[0];
    const obj = getTailwindColors(colours[0], {asHex: true});
    const tailwindColors = Object.values(obj);
    const originalIndex = tailwindColors.findIndex(c => c === originalColour);

    if (numColours <= 9 && originalIndex !== 0 && originalIndex !== 10) {
      colourList = [tailwindColors[1],colourList[0],tailwindColors[9]];
      domainVals = [0, (originalIndex-1)/9, 1];
    }
    else {
      colourList = [tailwindColors[0],colourList[0],tailwindColors[10]];
      domainVals = [0, originalIndex/10, 1];
    }
    
  }
  else if (stepwise) {
    // Calculate lightness for each color
    const lightnesses = colourList.map(c => chroma(c).lab()[0]);
    
    // Calculate lightness differences between consecutive colors
    const diffs = [];
    for (let i = 0; i < lightnesses.length - 1; i++) {
      diffs.push(Math.abs(lightnesses[i + 1] - lightnesses[i]));
    }
    
    // Calculate total lightness difference
    const totalDiff = diffs.reduce((sum, d) => sum + d, 0);
    
    // Calculate how many colors should go in each segment
    // We have (numColours - colourList.length) colors to distribute
    const colorsToDistribute = numColours - colourList.length;
    
    const segmentCounts = diffs.map(diff => {
      return Math.round((diff / totalDiff) * colorsToDistribute);
    });
    
    // Adjust for rounding errors to ensure we have exactly the right number of colors
    const totalAllocated = segmentCounts.reduce((sum, c) => sum + c, 0);
    const adjustment = colorsToDistribute - totalAllocated;
    if (adjustment !== 0) {
      // Add/subtract from the largest segment
      const maxIndex = segmentCounts.indexOf(Math.max(...segmentCounts));
      segmentCounts[maxIndex] += adjustment;
    }
    
    // Build the result by interpolating between each pair of colors
    const colorResult = [];
    for (let i = 0; i < colourList.length - 1; i++) {
      const segmentColors = segmentCounts[i] + 2; // +2 to include both endpoints
      const segment = chroma.scale([colourList[i], colourList[i + 1]])
        .mode(colorSpace === 'lab-bezier' ? 'lab' : colorSpace)
        .correctLightness(correctLightness)
        .colors(segmentColors);
      
      // Add all colors except the last one (to avoid duplicates)
      colorResult.push(...segment.slice(0, -1));
    }
    
    // Add the final color
    colorResult.push(colourList[colourList.length - 1]);
    
    return colorResult;
  }

  let colorResult;
  if (divergingColour == '') {
    scale = colorSpace === 'lab-bezier'
      ? chroma.bezier(colourList).scale()
      : chroma.scale(colourList).mode(colorSpace);

    colorResult = scale.correctLightness(correctLightness).domain(domainVals).colors(numColours);
  } else {
    const midIndex = colourList.indexOf(divergingColour);
    const firstHalf = colourList.slice(0, midIndex + 1);
    const secondHalf = colourList.slice(midIndex);

    const scale1 = colorSpace === 'lab-bezier'
      ? chroma.bezier(firstHalf).scale()
      : chroma.scale(firstHalf).mode(colorSpace);

    const scale2 = colorSpace === 'lab-bezier'
      ? chroma.bezier(secondHalf).scale()
      : chroma.scale(secondHalf).mode(colorSpace);

    const halfNum = Math.floor(numColours / 2);
    const colors1 = scale1.correctLightness(correctLightness).domain([0, 1]).colors(halfNum + 1);
    const colors2 = scale2.correctLightness(correctLightness).domain([0, 1]).colors(numColours - halfNum);

    colorResult = [...colors1.slice(0, -1), ...colors2];
  }

  // If keepOriginal is true, replace closest colors with original colors
  if (keepOriginal) {
    const usedIndices = new Set();

    // Mark indices that already match original colors
    colorResult.forEach((result, index) => {
      const resultHex = chroma(result).hex().toLowerCase();
      if (colourList.some(c => chroma(c).hex().toLowerCase() === resultHex)) {
        usedIndices.add(index);
      }
    });

    // Identify colors from colourList that are not in colorResult
    let originalColors = colourList.filter(original => {
      const originalHex = chroma(original).hex().toLowerCase();
      return !colorResult.some(result => chroma(result).hex().toLowerCase() === originalHex);
    });

    // Sort original colors by their distance to the closest color in the result (most different first)
    originalColors.sort((a, b) => {
      const getMinDist = (color) => {
        let min = Infinity;
        colorResult.forEach(result => {
          const dist = chroma.distance(color, result);
          if (dist < min) min = dist;
        });
        return min;
      };
      return getMinDist(b) - getMinDist(a);
    });

    // For each original color not in the result, find and replace the closest color
    originalColors.forEach(original => {
      let minDistance = Infinity;
      let closestIndex = -1;

      colorResult.forEach((result, index) => {
        if (usedIndices.has(index)) return;

        const distance = chroma.distance(original, result);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      if (closestIndex !== -1) {
        colorResult[closestIndex] = chroma(original).hex();
        usedIndices.add(closestIndex);
      }
    });
  }

  return colorResult
}

export function checkDivergingColors(colours) {
  if (colours.length < 3) return '';

  const firstL = chroma(colours[0]).lab()[0];
  const lastL = chroma(colours[colours.length - 1]).lab()[0];
  
  const minEndpointL = Math.min(firstL, lastL);
  const maxEndpointL = Math.max(firstL, lastL);

  let maxMiddleL = -Infinity;
  let maxMiddleColor = '';
  let minMiddleL = Infinity;
  let minMiddleColor = '';

  for (let i = 1; i < colours.length - 1; i++) {
    const c = colours[i];
    const l = chroma(c).lab()[0];
    
    if (l > maxMiddleL) {
      maxMiddleL = l;
      maxMiddleColor = c;
    }
    if (l < minMiddleL) {
      minMiddleL = l;
      minMiddleColor = c;
    }
  }

  if (maxMiddleL > maxEndpointL) {
    return maxMiddleColor;
  }
  if (minMiddleL < minEndpointL) {
    return minMiddleColor;
  }

  return '';
}

export function tailwindifyInput(colours) {
  console.log('Input colours:', colours);
  
  // Sort colors by lightness (lightest to darkest)
  const sortedColours = [...colours].sort((a, b) => {
    return chroma(b).lab()[0] - chroma(a).lab()[0];
  });
  
  console.log('Sorted colours:', sortedColours);
  
  let tailwindPosns = [];
  let firstTailwindColors = null;
  let lastTailwindColors = null;
  
  sortedColours.forEach((c, index) => {
    const twColors = getTailwindColors(c, {asHex: true});
    console.log('getTailwindColors result for', c, ':', twColors);
    
    if (index === 0) {
      firstTailwindColors = twColors;
    }
    if (index === sortedColours.length - 1) {
      lastTailwindColors = twColors;
    }
    
    const colorHex = chroma(c).hex().toLowerCase();
    const tailwindValues = Object.values(twColors);
    const originalIndex = tailwindValues.findIndex(hex => hex.toLowerCase() === colorHex);
    
    const mappedPosition = originalIndex !== -1 ? originalIndex : 5;
    tailwindPosns.push(mappedPosition);
  });
  
  // If first color's position isn't 0 and we have colors, add the first tailwind color
  if (tailwindPosns[0] > 0 && sortedColours.length > 0 && firstTailwindColors) {
    const firstTailwindColor = Object.values(firstTailwindColors)[0];
    sortedColours.unshift(firstTailwindColor);
    tailwindPosns.unshift(0);
  }
  
  // If last color's position isn't 10 and we have colors, add the last tailwind color
  const lastIdx = tailwindPosns.length - 1;
  if (tailwindPosns[lastIdx] < 10 && sortedColours.length > 0 && lastTailwindColors) {
    const lastTailwindColor = Object.values(lastTailwindColors)[10];
    sortedColours.push(lastTailwindColor);
    tailwindPosns.push(10);
  }
  
  console.log('After adding first and last:', sortedColours, tailwindPosns);
  
  return sortedColours.join(', ');
}

export function getDefaultNameVals(length) {
  const stepMap = {
    9: [100, 200, 300, 400, 500, 600, 700, 800, 900],
    10: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900],
    11: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
    12: [20, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
    13: [20, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 980],
  };
  return stepMap[length] || Array.from({length: length}, (_, i) => (i+1)*100);
}

export function colourParse(str) {
  if (!str || !str.trim()) return [];
  // Strip out square brackets and single or double quotes
  const cleanedStr = str.replace(/[\[\]'"]+/g, '');
  
  let parts;
  // If there are commas or semicolons, use them as delimiters
  if (/[;,]/.test(cleanedStr)) {
    parts = cleanedStr.split(/[;,]+/).map(s => s.trim()).filter(Boolean);
  } else {
    // Otherwise split on any whitespace (spaces, tabs, newlines)
    parts = cleanedStr.split(/\s+/).map(s => s.trim()).filter(Boolean);
  }
  
  const colours = [];
  
  parts.forEach((s, i) => {
    const match = s.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const st = match[2].replace(/^['"]+|['"]+$/g, '');
      colours.push(chroma.valid(st) ? chroma(st).hex() : '#000000');
    } else {
      colours.push(chroma.valid(s) ? chroma(s).hex() : '#000000');
    }
  });
  
  return colours;
}

export function nameParse(str) {
  // Split on commas or newlines
  if (!str || !str.trim()) return [];
  const parts = str.split(/[;,]+/).map(s => s.trim()).filter(Boolean);
  let names = [];
  
  parts.forEach((s, i) => {
    const match = s.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      // property: value format
      const st = match[2].replace(/^['"]+|['"]+$/g, '');
      names.push(match[1].trim().replace(/^['"]+|['"]+$/g, ''));
    }
  });
  
  return names;
}
