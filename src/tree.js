const assert = require('assert');
const { cloneDeep } = require('lodash');

function convertListToTreeMutating(list, parent, level=-1) {
	// each item of list is of shape {value, level}
	if (parent===undefined) {
		const first = list.shift();
		const node = {value: first.value};
		return convertListToTreeMutating(list, node, level=0);
	}

	if (list.length===0) {
		return parent;
	}

	var first = list.shift();
	while (first.level === level+1) {
		var node = {value: first.value, parent};
		var child = convertListToTreeMutating(list, node, level+1);
		if (parent.children===undefined) {parent.children = []};
		parent.children.push(child);
		if (list.length===0) {
			return parent;
		}
		var first = list.shift();
	}
	list.unshift(first);

	return parent;
}

function convertListToTree(list) {
	const deepCopiedList = cloneDeep(list);
	return convertListToTreeMutating(deepCopiedList);
}

function recurse(next) {
	function r(root, fn) {
		fn(root);
		const nextNodes = next(root);
		if (nextNodes) {
			nextNodes.forEach(c=>r(c,fn));
		}
	}
	return r;
}

function findMatching(root, filter) {
	const matches = [];
	recurse(n=>n.children)(root, n=>{
		if (filter(n)) {
			matches.push(n);
		}
	})
	return matches;
}

module.exports = {
	convertListToTree,
	recurse,
	findMatching
}