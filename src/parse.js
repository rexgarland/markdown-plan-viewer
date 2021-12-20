// For each line in the code:
// 	add it to the ordered tree (just the text)

// For each group of branches:
// 	create intra-group dependencies (ordered lists)
// For each parent:
// 	create dependencies from children (unordered or last ordered)
// For each explicit dep:
// 	find all matches, assert exists and unique, create dependency
// Ensure no cycles in the DAG

const assert = require('assert');
const { 
	convertListToTree,
	recurse,
	findMatching
} = require('./tree');
const {
	isHeader,
	isTask,
	getHeaderLevel,
	getIndentationLevel,
	isOrdered,
	hasExplicitDependencies,
	getDependencies,
	getDescription
} = require('./task');

function getLevel(line, lastLevel) {
	// the level is a tuple of (latestHeaderLevel, thisListLevel)
	// header level is '#'=>0, '##'=>1, etc
	// list level is '- ...'=>1, '\t- ...'=>2, etc
	// h+l is the "total level," used to ensure that the task hierarchy can be parsed correctly
	if (lastLevel===undefined) { // first task
		assert(isHeader(line), "First task must be a title (h1)");
		assert(getHeaderLevel(line)==0, "First task must be a title (h1)");
		return [0, 0];
	}
	// subsequent tasks
	if (isHeader(line)) {
		const headerLevel = getHeaderLevel(line);
		assert(headerLevel>0, `Only one h1 is allowed, check near line: '${line}'`);
		return [headerLevel, 0];
	} else {
		return [lastLevel[0], getIndentationLevel(line)];
	}
}

function attachLevels(lines) {

	var lastLevel = undefined;
	var linesWithLevels = [];

	lines.forEach(line=>{
		const level = getLevel(line, lastLevel);
		linesWithLevels.push({line, level});
		if (lastLevel !== undefined) {
			const headerDiff = level[0]-lastLevel[0];
			assert(headerDiff<=1, `Tasks cannot be parsed into a tree... check indentation or header level near line: '${line}'`)
			const totalLevel = level[0]+level[1];
			const lastTotalLevel = lastLevel[0]+lastLevel[1];
			const totalDiff = totalLevel-lastTotalLevel;
			assert(totalDiff<=1, `Tasks cannot be parsed into a tree... check indentation or header level near line: '${line}'`)
		}
		lastLevel = level;
	});

	// format for tree building
	linesWithLevels = linesWithLevels.map(({line, level}) => ({value: line, level: level[0]+level[1]}));

	return linesWithLevels;
}

function pairwise(arr, fn) {
	for(var i=0; i < arr.length - 1; i++){
        fn(arr[i], arr[i + 1])
    }
}

function createOrderedListDependencies(root) {
	if (root.children!==undefined) {
		if (root.children.length>1) {
			const orderedTasks = root.children.filter(n=>isOrdered(n.value));
			pairwise(orderedTasks, (n1, n2) => {
				if (n2.dependencies===undefined) {n2.dependencies=[]};
				n2.dependencies.push(n1);
			});
		}
		root.children.forEach(createOrderedListDependencies);
	}
}

function createParentChildDependencies(root) {
	if (root.children!==undefined) {
		if (root.dependencies===undefined) {root.dependencies=[]};
		root.children.filter(n=>!isOrdered(n.value)).forEach(n=>{
			root.dependencies.push(n);
		});
		const orderedChildren = root.children.filter(n=>isOrdered(n.value));
		if (orderedChildren.length>0) {
			const n = orderedChildren[orderedChildren.length-1]
			root.dependencies.push(n);
		}
		root.children.forEach(createParentChildDependencies);
	}
}

function createExplicitDependencies(root) {
	// find all the explicit dependencies
	const explicitDependencies = [];
	recurse(root, n=>{
		if (hasExplicitDependencies(n.value)) {
			explicitDependencies.push({node:n, dependencies:getDependencies(n.value)});
		}
	});
	// for each, search the tree for a match
	explicitDependencies.forEach(({node, dependencies}) => {
		if (node.dependencies===undefined) {node.dependencies=[]};
		dependencies.forEach(d=>{
			const matches = findMatching(root, n=>n.value.includes(d));
			// if one unique match, add, else error
			assert(matches.length<2, `Found multiple tasks matching dependency: '${d}'`);
			assert(matches.length===1, `Could not find task matching dependency: '${d}'`);
			const match = matches[0];
			node.dependencies.push(match);
		});
	})
}

function parse(text, cb) {
	// the callback function takes (value, error)

	// split into lines
	var lines = text.split('\n');
	// ignore non-task lines
	lines = lines.filter(isTask);

	try {

		// connect the DAG
		const linesWithLevels = attachLevels(lines);
		const root = convertListToTree(linesWithLevels);
		createOrderedListDependencies(root);
		createParentChildDependencies(root);
		createExplicitDependencies(root);

		// clean up the text
		recurse(root, n=>{n.descr=getDescription(n.value);});

		dag = root;

		cb(dag, null);

	} catch (err) {
		cb(null, err);
	}

}

module.exports = {
	parse
}