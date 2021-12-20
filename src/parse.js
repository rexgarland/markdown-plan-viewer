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
const { convertListToTree } = require('./tree');

function isHeader(line) {
	return /#+\s[^\s]+/.test(line);
}

function isTask(line) {
	if (line.trim().length === 0) { return false };
	// headline
	if (isHeader(line)) { return true };
	// unordered list
	if (/\t*(\*|-|\+)\s[^\s]+/.test(line)) { return true };
	// ordered list
	if (/\t*[0-9]+\.\s[^\s]+/.test(line)) { return true };
	return false
}

function getHeaderLevel(line) {
	assert(isHeader(line), `Expected header for line: '${line}'`);
	var count = 0;
	while (line[count]=='#') {
		count = count + 1;
	}
	return count-1;
}

function getListLevel(line) {
	var count = 0;
	while (line[count]=='\t') {
		count = count + 1;
	}
	return count+1;
}

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
		return [lastLevel[0], getListLevel(line)];
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

function parse(text, cb) {
	// the callback function takes (value, error)

	// split into lines
	var lines = text.split('\n');
	// ignore non-task lines
	lines = lines.filter(isTask);

	try {

		const linesWithLevels = attachLevels(lines);
		const tree = convertListToTree(linesWithLevels);

		dag = tree;

		cb(dag, null);

	} catch (err) {
		cb(null, err);
	}

}

module.exports = {
	parse
}