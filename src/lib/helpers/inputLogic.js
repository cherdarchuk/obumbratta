export function reorderInputColours(inputValue, fromIndex, toIndex) {
  if (fromIndex === toIndex) return inputValue;

  const separators = /([;,]+)/;
  const rawParts = inputValue.split(separators);
  
  let colorIndices = [];
  
  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    if (part.match(/^[;,]+$/)) continue;
    
    const cleanedPart = part.replace(/[\[\]'"]+/g, '');
    if (!cleanedPart.trim()) continue;
    
    colorIndices.push(i);
  }

  if (fromIndex >= colorIndices.length || toIndex >= colorIndices.length) return inputValue;

  // Extract contents
  const contents = colorIndices.map(idx => rawParts[idx]);
  
  // Reorder contents
  const [movedItem] = contents.splice(fromIndex, 1);
  contents.splice(toIndex, 0, movedItem);
  
  // Put back
  colorIndices.forEach((rawIdx, i) => {
    rawParts[rawIdx] = contents[i];
  });
  
  return rawParts.join('');
}

export function updateInputColour(inputValue, index, newHex) {
  const separators = /([;,]+)/;
  const rawParts = inputValue.split(separators);
  
  let colorCount = 0;
  let newInputValue = "";
  
  for (let i = 0; i < rawParts.length; i++) {
    const part = rawParts[i];
    
    // If it's a separator, just append
    if (part.match(/^[;,]+$/)) {
      newInputValue += part;
      continue;
    }
    
    const cleanedPart = part.replace(/[\[\]'"]+/g, '');
    if (!cleanedPart.trim()) {
      newInputValue += part;
      continue;
    }
    
    // It's a color
    if (colorCount === index) {
      // Replace this part
      const match = part.match(/^([^:]+:)(\s*)(.+)$/);
      if (match) {
         // preserve name
         newInputValue += match[1] + match[2] + newHex;
      } else {
         // preserve whitespace
         const leadingSpace = part.match(/^\s*/)[0];
         const trailingSpace = part.match(/\s*$/)[0];
         newInputValue += leadingSpace + newHex + trailingSpace;
      }
    } else {
      newInputValue += part;
    }
    
    colorCount++;
  }
  
  return newInputValue;
}
