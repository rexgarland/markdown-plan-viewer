var cytoscape = require('cytoscape');
var memoize = require('lodash.memoize')

var data = require('./app.plan.json');

var nodes = data.map( task => {
	var node = {
		data: {
			id: task.id,
			description: task.description
		}
	};
	if (task.type != null) {
		node.classes = [task.type]
		node.duration = task.duration
		node.percentComplete = (task.duration-task.remaining)/task.duration
	} else {
		node.classes = ['label']
	}
	return node
});
var edges = data.filter( task => task.dependencies.length > 0).flatMap( task => {
	return task.dependencies.map( id => {
		return {
			data: {
				id: `${id}->${task.id}`,
				source: id,
				target: task.id
			}
		}
	})
});
var elements = nodes.concat(edges);

var makeSvg = memoize((ele) =>{
	var svgText = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg>
<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='100' height='100'>
	<circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="slategray" />
</svg>`
	const parser = new DOMParser();
	const svg = parser.parseFromString(svgText, 'text/xml').documentElement;
	var data = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.outerHTML);
	const width = 20
	const height = 20
	return {svg: data, width: width, height: height};
});

var cy = cytoscape({ 
	elements: elements,
	container: document.getElementById('cy'),
	style: [ // the stylesheet for the graph
	    {
	      selector: 'node',
	      style: {
	        'label': 'data(description)',
	        'background-fit': 'cover'
	      }
	    },

	    {
	    	selector: '.label',
	    	style: {
	        	'background-color': '#666',
		        'shape': 'ellipse',
		        'width': '8px',
		        'height': '8px'
		    }
	    },

	    { 
	    	selector: '.work',
	    	style: {
		        'background-image': function(ele){ return makeSvg(ele).svg; },
		        'width': function(ele){ return makeSvg(ele).width; },
		        'height': function(ele){ return makeSvg(ele).height; }
	    	}
	    },

	    { 
	    	selector: '.wait',
	    	style: {
	    		'background-color': 'gainsboro',
		        'width': '20px',
		        'height': '20px'
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