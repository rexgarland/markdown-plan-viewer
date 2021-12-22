const assert = require('assert');
const _ = require('lodash');

const { 
	convertListToTree,
	recurse,
	findMatching
} = require('./tree');
const {
	isHeader,
	isTask,
	getHeaderLevel,
	isOrdered,
	hasExplicitDependencies,
	getDependencies,
	getDescription,
	getEstimate,
	getMeasurement,
	getDeadline,
	getType,
	getCompletion
} = require('./task');
const {
	inferIndentation,
	getIndentationLevel
} = require('./stringUtils');

const recurseChildren = recurse(n=>n.children);
const recurseDependencies = recurse(n=>n.dependencies);

function getLevel(indent) {
	const indentLevel = getIndentationLevel(indent);
	return (line, lastLevel) => {
		// the level is a tuple of (latestHeaderLevel, thisListLevel)
		// header level is '#'=>0, '##'=>1, etc
		// list level is '- ...'=>1, '\t- ...'=>2, etc
		// h+l is the "total level," used to ensure that the task hierarchy can be parsed correctly
		if (!lastLevel) { // first task
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
			return [lastLevel[0], indentLevel(line)+1];
		}
	}
}

function attachLevels(lines) {

	var lastLevel = undefined;
	var linesWithLevels = [];

	const indent = inferIndentation(lines);

	lines.forEach(line=>{
		const level = getLevel(indent)(line, lastLevel);
		linesWithLevels.push({line, level});
		if (lastLevel) {
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
	if (root.children) {
		if (root.children.length>1) {
			const orderedTasks = root.children.filter(n=>n.isOrdered);
			pairwise(orderedTasks, (n1, n2) => {
				if (!n2.dependencies) {n2.dependencies=[]};
				n2.dependencies.push(n1);
			});
		}
		root.children.forEach(createOrderedListDependencies);
	}
}

function createParentChildDependencies(root) {
	if (root.children) {
		if (!root.dependencies) {root.dependencies=[]};
		root.children.filter(n=>!n.isOrdered).forEach(n=>{
			root.dependencies.push(n);
		});
		const orderedChildren = root.children.filter(n=>n.isOrdered);
		if (orderedChildren.length>0) {
			const n = orderedChildren[orderedChildren.length-1]
			root.dependencies.push(n);
		}
		root.children.forEach(createParentChildDependencies);
	}
}

function linkExplicitDependencies(root) {
	// find all the explicit dependencies
	const explicitDependencies = [];
	recurseChildren(root, n=>{
		if (n.explicitDependencies) {
			explicitDependencies.push({node:n, dependencies:n.explicitDependencies});
			delete(n.explicitDependencies);
		}
	});
	// for each, search the tree for a match
	explicitDependencies.forEach(({node, dependencies}) => {
		if (!node.dependencies) {node.dependencies=[]};
		dependencies.forEach(d=>{
			const matches = findMatching(root, n=>n.description.includes(d));
			// if one unique match, add, else error
			assert(matches.length<2, `Found multiple tasks matching dependency: '${d}'`);
			assert(matches.length===1, `Could not find task matching dependency: '${d}'`);
			const match = matches[0];
			node.dependencies.push(match);
		});
	})
}

function assignIfDefined(node) {
	return (name, fn) => {
		const val = fn(node.value);
		if (val) { node[name] = val };
	}
}

function parseTaskData(node) {
	assign = assignIfDefined(node);
	assign('isOrdered', isOrdered);
	assign('description', getDescription);
	assign('type', getType);
	assign('estimate', getEstimate);
	assign('measurement', getMeasurement);
	assign('deadline', getDeadline);
	assign('explicitDependencies', getDependencies);
	assign('done', getCompletion);
	delete(node.value);
}

function validateNoTimedTaskHasTimedAncestor(root, timedAncestor) {
	if (!timedAncestor && root.estimate) {
		timedAncestor = root;
	} else {
		assert(!(timedAncestor && root.estimate), `Task '${root.description}' has a timed ancestor.`);
	}
	root?.children?.forEach(c=>validateNoTimedTaskHasTimedAncestor(c, timedAncestor))
}

function trickleDependencies(root, dependencies) {
	if (dependencies) {
		root.dependencies = (!!root.dependencies ? root.dependencies : []).concat(dependencies);
	}
	root?.children?.forEach(c=>trickleDependencies(c,root.dependencies));
}

function validateDescriptionsAreUnique(root) {
	const descriptions = [];
	recurseChildren(root, c=>{
		assert(!descriptions.includes(c.description), `Duplicate task with description: '${c.description}'`);
		descriptions.push(c.description);
	});
}

function validateNoCycles(root) {
	const visited = {};
	const onStack = {};
	const t = hasCycle(root, visited, onStack);
	assert(!t, `Plan has a dependency cycle involving task: '${t.description}'`);
}

function hasCycle(task, visited, onStack) {
	visited[task.description] = true
	onStack[task.description] = true
	if (task.dependencies) {
		for (var i=0; i<task.dependencies.length; i++) {
			var dependency = task.dependencies[i];
			if (!visited[dependency.description]) {
				var c = hasCycle(dependency, visited, onStack);
				if (c) {
					return c;
				}
			} else if (onStack[dependency.description]) {
				return dependency
			}
		}
	}
	onStack[task.description] = false
	return false
}

function unique(arr) {
	return arr.reduce((a,v)=>(a.includes(v)?a:a.concat(v)),[]);
}

function remove(arr, val) {
	const i = arr.indexOf(val);
	if (i>=0) {
		arr.splice(i,1);
	}
}

function ensureUniqueDependencies(root) {
	recurseChildren(root, n=>{if (n.dependencies) {n.dependencies=unique(n.dependencies)}});
}

function trimRedundantDependencies(root) {
	// this implementation is DEFINITELY NOT OPTIMAL...
	// will blow up on larger graphs
	function trim(node) {
		if (!node.dependencies) { return };
		const deps = _.clone(node.dependencies);
		deps.forEach(dep=> {
			const otherDeps = deps.filter(otherDep=>(otherDep!==dep));
			otherDeps.forEach(otherDep=>{
				recurseDependencies(otherDep, ({dependencies})=>{
					if (dependencies) {
						dependencies.forEach(d=>{
							if (deps.includes(d)) {
								remove(node.dependencies, d);
							}
						});
					}
				});
			});
		});
	}
	recurseDependencies(root,trim);
}

function validateDeadlines(root) {
	function assertChronological(node) {
		if (node.deadline) {
			recurseDependencies(node, ({dependencies}) => {
				if (dependencies) {
					dependencies.forEach(d=>{
						if (d.deadline) {
							assert(d.deadline<node.deadline, `Deadlines must be chronological: '${d.description}' before '${node.description}'`);
						}
					})
				}
			})
		}
	}
	recurseDependencies(root, assertChronological);
}

function createGraphNodeFromTask(task) {
	const required = ['id','description'];
	const data = {};
	required.forEach(s=>{data[s] = task[s];})
	const optional = ['type','estimate','measurement','deadline','done'];
	optional.forEach(s=>{
		if (task[s]!==undefined) {
			data[s] = task[s];
		}
	});
	return {data};
	// return {data: {...task}};
}

function createGraphElements(root) {
	const elements = [];
	// give each task an id
	var i = 0;
	recurseDependencies(root, t=>{t.id = i++;});
	// create nodes
	recurseDependencies(root, t=>{
		const node = createGraphNodeFromTask(t);
		elements.push(node);
	});
	// create edges
	recurseDependencies(root, t=>{
		t.dependencies?.forEach(d=>{
			const edge = {
				data: {
					id: `${d.id}->${t.id}`,
					source: d.id,
					target: t.id
				}
			};
			elements.push(edge);
		});
	});
	return elements;
}

function parse(text, cb) {
	// the callback function takes (value, error)

	// split into lines
	var lines = text.split('\n');
	// ignore non-task lines
	lines = lines.filter(isTask);

	try {

		// create tree
		const linesWithLevels = attachLevels(lines);
		const root = convertListToTree(linesWithLevels);

		// parse task information
		recurseChildren(root, parseTaskData);

		// link dependencies and validate DAG
		validateDescriptionsAreUnique(root);
		linkExplicitDependencies(root);
		validateNoTimedTaskHasTimedAncestor(root);
		createOrderedListDependencies(root);
		trickleDependencies(root);
		createParentChildDependencies(root);
		validateNoCycles(root);
		ensureUniqueDependencies(root);
		trimRedundantDependencies(root);
		validateDeadlines(root);

		// format DAG
		dag = createGraphElements(root);

		cb(dag, null);

	} catch (err) {
		cb(null, err);
	}

}

module.exports = {
	parse
}