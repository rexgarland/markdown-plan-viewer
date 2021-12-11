var cytoscape = require('cytoscape');

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

function workSvg(ele) {
	var svgText = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg>
<svg xmlns='http://www.w3.org/2000/svg' version='1.1' width='100' height='100'>
	<circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
</svg>`
	const parser = new DOMParser();
	const svg = parser.parseFromString(svgText, 'text/xml').documentElement;
	var data = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.outerHTML);
	return data;
}

var cy = cytoscape({ 
	elements: elements,
	container: document.getElementById('cy'),
	style: [ // the stylesheet for the graph
	    {
	      selector: 'node',
	      style: {
	        'background-color': '#666',
	        'label': 'data(description)',
	        'background-fit': 'cover'
	      }
	    },

	    {
	    	selector: '.label',
	    	style: {
		        'shape': 'square',
		        'width': '8px',
		        'height': '8px'
		    }
	    },

	    { 
	    	selector: '.work',
	    	style: {
	    		// 'background-color': 'gainsboro',
		        'width': '20px',
		        'height': '20px',
		        'background-image': workSvg,
		        // 'background-image': 'https://live.staticflickr.com/7272/7633179468_3e19e45a0c_b.jpg'
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