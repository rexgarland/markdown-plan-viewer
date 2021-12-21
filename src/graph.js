var cytoscape = require('cytoscape');
var memoize = require('lodash.memoize');

const R = 2; // pixels
const spacerThickness = 0.8*R;
const boxThickness = R;
const margin = 0;

const barMaxWidth = R*16;
const barMinWidth = 2*R;
const spacerWidth = barMaxWidth+2*spacerThickness;
const boxWidth = spacerWidth+2*boxThickness;
const width = boxWidth+2*margin;

const textWidth = width*1.6;
const textMargin = -2*R;

const doneRadius = 8;
const doneThickness = boxThickness;
const checkLength = 2;

const colorForType = {
	'work': 'black',
	'wait': 'lightgray'
}

function getBarHeight(estimate) {
	const min = 2*R;
	const max = barMaxWidth*0.8;
	if (estimate===0.5) {
		return min;
	} else if (estimate===2) {
		return min+(max-min)*0.4;
	} else if (estimate>=5) {
		return barMaxWidth*0.8;
	} else {
		return min;
	}
}

function getBarWidth(measurement, estimate) {
	const fraction = Math.min(1, measurement/estimate);
	const range = barMaxWidth-barMinWidth;
	return barMinWidth+fraction*range;
}

function packageSVG(text) {
	const parser = new DOMParser();
	const svg = parser.parseFromString(text, 'text/xml').documentElement;
	return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.outerHTML);
}


var makeBarSVG = (estimate, measurement, type) => {
	const barHeight = getBarHeight(estimate);
	const barWidth = (measurement) ? getBarWidth(measurement, estimate) : 0;

	const spacerHeight = barHeight+2*spacerThickness;
	const boxHeight = spacerHeight+2*boxThickness;
	const height = boxHeight+2*margin;

	const boxOffset = margin;
	const boxRadius = R+spacerThickness+boxThickness;

	const spacerOffset = margin+boxThickness;
	const spacerRadius = R+spacerThickness;

	const barOffset = margin+boxThickness+spacerThickness;

	const color = colorForType[type];

	var svgText = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg>
<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='${width}' height='${height}'>
	<rect x="${boxOffset}" y="${boxOffset}" rx="${boxRadius}" ry="${boxRadius}" 
		width="${boxWidth}" height="${boxHeight}"
		fill="${color}"/>
	<rect x="${spacerOffset}" y="${spacerOffset}" rx="${spacerRadius}" ry="${spacerRadius}" 
		width="${spacerWidth}" height="${spacerHeight}"
		fill="white"/>
	<rect x="${barOffset}" y="${barOffset}" rx="${R}" ry="${R}" 
		width="${barWidth}" height="${barHeight}"
		fill="${color}"/>
</svg>`
	const data = packageSVG(svgText);
	return {svg: data, width: width, height: height};
}

function makeDoneSVG(estimate, measurement, type) {
	const side = 2*doneRadius+doneThickness;
	const middle = side/2;

	const color = colorForType[type];

	var svgText = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg>
<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='${side}' height='${side}'>
	<circle cx="${middle}" cy="${middle}" r="${doneRadius}" fill="white" stroke="${color}" stroke-width="${doneThickness}" />
	<path stroke-width="${doneThickness}" stroke="${color}" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M${middle},${middle} m-${checkLength*1.4},0 l${checkLength},${checkLength} l${2*checkLength},-${2*checkLength}" />
</svg>`

	const data = packageSVG(svgText);
	return {svg: data, width: side, height: side};
}


var makeSvg = memoize((ele) =>{
	const estimate = ele.data('estimate');
	const measurement = ele.data('measurement');
	const type = ele.data('type');
	if (!ele.data('done')) {
		return makeBarSVG(estimate, measurement, type);
	} else {
		// most be a waiting task
		return makeDoneSVG(estimate, measurement, type);
	}
});

function attachNodeClass(ele) {
	if (ele.data.type==='work') {
		ele.classes = (ele.classes) ? ele.classes.concat('work') : ['work'];
	} else if (ele.data.type==='wait') {
		ele.classes = (ele.classes) ? ele.classes.concat('wait') : ['wait'];
	} else {
		ele.classes = (ele.classes) ? ele.classes.concat('label') : ['label'];
	}
}

function attachClassData(elements) {
	elements.filter(ele=>(ele.data.target===undefined)).forEach(attachNodeClass);
}

function getBackgroundImage(ele) {
	return makeSvg(ele).svg;
}

function getWidth(ele) {
	return makeSvg(ele).width;
}

function getHeight(ele) {
	return makeSvg(ele).height;
}

function getBoundingShape(ele) {
	if (ele.data('done')) {
		return 'ellipse';
	} else {
		return 'rectangle';
	}
}

function createGraph(container) {
	return (elements) => {
		// attach css data to nodes
		attachClassData(elements);
		return cytoscape({ 
			elements,
			container,
			style: [ // the stylesheet for the graph
			    {
			      selector: 'node',
			      style: {
			        'label': 'data(description)',
			        'font-family': 'sans-serif',
			        'font-size': 12,
			        'font-weight': 'bold',
			        'text-wrap': 'wrap',
			        'text-max-width': textWidth,
			        'text-margin-y': textMargin,
			        'background-fit': 'cover'
			      }
			    },

			    {
			    	selector: '.label',
			    	style: {
			        	'background-color': 'black',
				        'shape': 'ellipse',
				        'width': '8px',
				        'height': '8px'
				    }
			    },

			    { 
			    	selector: '.work',
			    	style: {
			    		'shape': getBoundingShape,
			    		'background-opacity': 0,
				        'background-image': getBackgroundImage,
				        'width': getWidth,
				        'height': getHeight
			    	}
			    },

			    { 
			    	selector: '.wait',
			    	style: {
			    		'shape': getBoundingShape,
			    		'background-opacity': 0,
				        'background-image': getBackgroundImage,
				        'width': getWidth,
				        'height': getHeight
			    	}
			    },

			    {
			      selector: 'edge',
			      style: {
			        'width': 3,
			        'line-color': '#ccc',
			        'target-arrow-color': '#ccc',
			        'target-arrow-shape': 'triangle',
			        'curve-style': 'bezier'
			      }
			    }
			  ],
			layout: {
			    name: 'cose'
			  }
		});
	}
}

module.exports = {
	createGraph
}