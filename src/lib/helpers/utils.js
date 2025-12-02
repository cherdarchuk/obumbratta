import {format} from 'd3';

export const convertStrings = (obj, excludeKeys = []) => {
  if (Array.isArray(obj)) {
    // If the object is an array, recursively process each element
    return obj.map((item) => convertStrings(item, excludeKeys));
  } else if (typeof obj === "object" && obj !== null) {
    // If the object is a plain object, recursively process each key-value pair
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        // Skip conversion for keys in the excludeKeys list
        if (excludeKeys.includes(key)) {
          return [key, value];
        }
        return [key, convertStrings(value, excludeKeys)];
      })
    );
  } else if (typeof obj === "string") {
    // Convert number strings to numbers
    if (!isNaN(obj) && obj.trim() !== "") {
      return Number(obj);
    }
    // Convert boolean strings to booleans
    if (obj.toLowerCase() === "true") {
      return true;
    }
    if (obj.toLowerCase() === "false") {
      return false;
    }
  }
  // Return the value as-is if no conversion is needed
  return obj;
};

export const isBetween = (val, extent) => {
  return val >= extent[0] && val < extent[1];
}

export const formatNum = (num, fmt="percent") => {
  if (fmt === "percent") {
    return format(".0%")(num);
  } else if (fmt === "oppositePercent") {
    return format(".0%")((1-num));
  } else if (fmt === "percentIndexedToOne") {
    return format("+.1%")(num-1);
  } else if (fmt === "number") {
    return format(",.0~f")(num);
  } else if (fmt === "flatnum") {
    return format(".0~f")(num);
  } else if (fmt === "dollars") {
    return format("$.3~s")(num).replace(/G/, 'B').replace(/k/, 'K');
  }
  else {
    return format(fmt)(num);
  }
  return num;
}



export const range = (start, stop, step = 1) => {
  const result = [];
  let current = start;

  // Use integer arithmetic to avoid floating-point precision issues
  const multiplier = 1 / step; // Convert step to an integer multiplier
  const intStart = Math.round(start * multiplier);
  const intStop = Math.round(stop * multiplier);
  const intStep = Math.round(step * multiplier);

  for (let i = intStart; i <= intStop; i += intStep) {
    current = i / multiplier; // Convert back to the original scale
    result.push(current);
  }

  return result;
}




  // Copy to clipboard with proper error handling and return values
  export const copyToClipboard = async (text) => {
    try {
      // Attempt to use the modern clipboard API
      await navigator.clipboard.writeText(text);
      console.log('Copied "' + text + '" to clipboard');
      return { success: true, message: 'Text copied to clipboard successfully' };
    } catch (e1) {
      console.log('navigator.clipboard.writeText not working, trying execCommand');
      
      // Fallback to execCommand for older browsers
      try {
        // Create a temporary input element
        const inputElement = document.createElement('input');
        inputElement.value = text;
        inputElement.style.position = 'absolute';
        inputElement.style.left = '-9999px'; // Move it off-screen
        document.body.appendChild(inputElement);

        // Select the text and execute the copy command
        inputElement.select();
        const successful = document.execCommand('copy');
        
        // Remove the temporary input element
        document.body.removeChild(inputElement);
        
        if (successful) {
          console.log('Copy command was successful');
          return { success: true, message: 'Text copied to clipboard successfully' };
        } else {
          console.log('Copy command was unsuccessful');
          return { success: false, error: 'Copy command failed' };
        }
      } catch (e2) {
        console.error('Could not copy to clipboard', e2);
        return { success: false, error: 'Failed to copy to clipboard: ' + e2.message };
      }
    }
  };