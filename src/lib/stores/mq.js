import { readable } from "svelte/store";

const breakpoints = {
	mobileMin: 320,
  mobileMax: 700,
  tabletMax: 1024,
  //desktopMax: 1440 //Not used because there is not desktop max
}

const queries = {
  "mobile": `(max-width: ${breakpoints.mobileMax}px)`,
  "tablet": `(min-width: ${breakpoints.mobileMax+1}px) and (max-width: ${breakpoints.tabletMax}px)`,
  "desktop": `(min-width: ${breakpoints.tabletMax + 1}px)`,
  "tooNarrow": `(max-width: ${breakpoints.mobileMin}px)`,
  //"tooShort": "(max-Height: 360px)",
  // "shortLaptop": `(min-width: ${breakpoints.laptopMin}px) and (max-height: ${breakpoints.laptopMinHeight}px)`,
	// "sm": "(max-width: 767px)",
	// "md": "(min-width: 768px) and (max-width: 1023px)",
	// "lg": "(min-width: 1024px)",
	// "xl": "(min-width: 1280px)",
	"reducedMotion": "(prefers-reduced-motion: reduce)"
};

function calculateMedia(mqls) {
	const media = { classNames: '' };
	const mediaClasses = [];
	for (let name in mqls) {
		media[name] = mqls[name].matches;
		if (media[name]) mediaClasses.push(`mq-${name}`);
	}
	media.classNames = mediaClasses.join(" ");
	return media;
}

export default readable({}, (set) => {
	if (typeof window === "undefined") return;
	const mqls = {};
	const onChange = () => set(calculateMedia(mqls));
	
	if (typeof window !== "undefined") {
		for (let q in queries) {
			mqls[q] = window.matchMedia(queries[q]);
			mqls[q].addListener(onChange);
		}

		onChange();
	}
	
	return () => {
		for (let q in mqls) {
			mqls[q].removeListener(onChange);
		}
	};
});
