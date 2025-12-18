import chroma from 'chroma-js';


/**
 * The Color Blindness Simulation function is
 * copyright (c) 2000-2001 by Matthew Wickline and the
 * Human-Computer Interaction Resource Network ( http://hcirn.com/ ).
 */

const GAMMA = 2.2;

const BLINDER_DATA = {
    protanopia: { x: 0.7465, y: 0.2535, m: 1.273463, yi: -0.073894 },
    deuteranopia: { x: 1.4, y: -0.4, m: 0.968437, yi: 0.003331 },
    tritanopia: { x: 0.1748, y: 0, m: 0.062921, yi: 0.292119 }
};

// Precise matrices from the source file
const MATRIX_XYZ_RGB = [
    3.240712470389558, -0.969259258688888, 0.05563600315398933,
    -1.5372626602963142, 1.875996969313966, -0.2039948802843549,
    -0.49857440415943116, 0.041556132211625726, 1.0570636917433989
];

const MATRIX_RGB_XYZ = [
    0.41242371206635076, 0.21265606784927693, 0.019331987577444885,
    0.3575793401363035, 0.715157818248362, 0.11919267420354762,
    0.1804662232369621, 0.0721864539171564, 0.9504491124870351
];

function hexToRgb(hex) {
    const res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return res ? { R: parseInt(res[1], 16), G: parseInt(res[2], 16), B: parseInt(res[3], 16) } : { R: 0, G: 0, B: 0 };
}

function rgbToHex(r, g, b) {
    const toHex = (c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, '0');
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function simulateColor(rgb, typeKey) {
    const line = BLINDER_DATA[typeKey];
    
    // RGB to Linear
    let R = rgb.R / 255;
    let G = rgb.G / 255;
    let B = rgb.B / 255;
    R = (R > 0.04045) ? Math.pow(((R + 0.055) / 1.055), 2.4) : R / 12.92;
    G = (G > 0.04045) ? Math.pow(((G + 0.055) / 1.055), 2.4) : G / 12.92;
    B = (B > 0.04045) ? Math.pow(((B + 0.055) / 1.055), 2.4) : B / 12.92;

    // Linear RGB to XYZ
    const X = R * MATRIX_RGB_XYZ[0] + G * MATRIX_RGB_XYZ[3] + B * MATRIX_RGB_XYZ[6];
    const Y = R * MATRIX_RGB_XYZ[1] + G * MATRIX_RGB_XYZ[4] + B * MATRIX_RGB_XYZ[7];
    const Z = R * MATRIX_RGB_XYZ[2] + G * MATRIX_RGB_XYZ[5] + B * MATRIX_RGB_XYZ[8];

    // XYZ to xyY
    const n = X + Y + Z;
    const c = (n === 0) ? {x: 0, y: 0, Y: Y} : {x: X / n, y: Y / n, Y: Y};

    // Confusion Line Math
    const slope = (c.y - line.y) / (c.x - line.x);
    const yi = c.y - c.x * slope;
    const dx = (line.yi - yi) / (slope - line.m);
    const dy = (slope * dx) + yi;

    // Handle edge case: if dy is 0 (black color), return black
    if (Math.abs(dy) < 1e-10) {
        return { R: 0, G: 0, B: 0 };
    }

    // Simulated XYZ
    const zX = dx * c.Y / dy;
    const zY = c.Y;
    const zZ = (1 - (dx + dy)) * c.Y / dy;

    // --- NEUTRAL SHIFT LOGIC ---
    // find neutral grey using D65 white-point
    const ngx = 0.312713 * c.Y / 0.329016; 
    const ngz = 0.358271 * c.Y / 0.329016;
    const dX = ngx - zX;
    const dZ = ngz - zZ;

    // Calculate how much to shift to fit in RGB space
    const dR = dX * MATRIX_XYZ_RGB[0] + dZ * MATRIX_XYZ_RGB[6]; 
    const dG = dX * MATRIX_XYZ_RGB[1] + dZ * MATRIX_XYZ_RGB[7];
    const dB = dX * MATRIX_XYZ_RGB[2] + dZ * MATRIX_XYZ_RGB[8];

    let r_lin = zX * MATRIX_XYZ_RGB[0] + zY * MATRIX_XYZ_RGB[3] + zZ * MATRIX_XYZ_RGB[6];
    let g_lin = zX * MATRIX_XYZ_RGB[1] + zY * MATRIX_XYZ_RGB[4] + zZ * MATRIX_XYZ_RGB[7];
    let b_lin = zX * MATRIX_XYZ_RGB[2] + zY * MATRIX_XYZ_RGB[5] + zZ * MATRIX_XYZ_RGB[8];

    const _r = ((r_lin < 0 ? 0 : 1) - r_lin) / dR;
    const _g = ((g_lin < 0 ? 0 : 1) - g_lin) / dG;
    const _b = ((b_lin < 0 ? 0 : 1) - b_lin) / dB;

    let adjust = Math.max(
        (_r > 1 || _r < 0) ? 0 : _r,
        (_g > 1 || _g < 0) ? 0 : _g,
        (_b > 1 || _b < 0) ? 0 : _b
    );

    // Shift proportionally and apply gamma
    const finalR = 255 * Math.pow(Math.max(0, Math.min(1, r_lin + adjust * dR)), 1 / GAMMA);
    const finalG = 255 * Math.pow(Math.max(0, Math.min(1, g_lin + adjust * dG)), 1 / GAMMA);
    const finalB = 255 * Math.pow(Math.max(0, Math.min(1, b_lin + adjust * dB)), 1 / GAMMA);

    return { R: finalR, G: finalG, B: finalB };
}

export function getSimulatedColors(colors, type = 'deuteranopia') {
    return colors.map(hex => colorBlindSim(hex, type));
}


export function colorBlindSim(color, type) {
    const simulated = simulateColor(hexToRgb(color), type);
    return rgbToHex(simulated.R, simulated.G, simulated.B);
}

export function isColorBlindSafe(colors, type) {
    let notok = [];
    let ratioThreshold = 4;
    let smallestPerceivableDistance = 9;
    let k = colors.length;
    if (!k) {
        // console.log('no colors', type);
        return true;
    }
    // compute distances between colors
    for (let a = 0; a < k; a++) {
        for (let b = a + 1; b < k; b++) {
            let colorA = chroma(colors[a]);
            let colorB = chroma(colors[b]);
            let distanceNorm = difference(colorA, colorB);
            if (distanceNorm < smallestPerceivableDistance) continue;
            let aSim = colorBlindSim(colorA.hex(), type);
            let bSim = colorBlindSim(colorB.hex(), type);
            let distanceSim = difference(aSim, bSim);
            let isNotOk =
                distanceNorm / distanceSim > ratioThreshold &&
                distanceSim < smallestPerceivableDistance;
            if (isNotOk) {
              notok.push(aSim, bSim);
              //console.log(type, colors[a],colors[b],aSim+'',bSim+'', distanceNorm, distanceSim, distanceNorm/distanceSim);
            }
        }
    }
    // console.log(type, notok/(ok+notok));
    // compute share of problematic colorss
    return notok;
}

function difference(colorA, colorB) {
    return (
        0.5 * (chroma.deltaE(colorA, colorB) + chroma.deltaE(colorB, colorA))
    );
}

