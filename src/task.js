const assert = require('assert');

function isHeader(line) {
	return /#+\s+[^\s].*/.test(line);
}

function isOrdered(line) {
	return /\t*[0-9]+\.\s+[^\s].*/.test(line);
}

function isTask(line) {
	if (line.trim().length === 0) { return false };
	// headline
	if (isHeader(line)) { return true };
	// unordered list
	if (/\t*(\*|-|\+)\s+[^\s].*/.test(line)) { return true };
	// ordered list
	if (isOrdered(line)) { return true };
	return false;
}

function getHeaderLevel(line) {
	assert(isHeader(line), `Expected header for line: '${line}'`);
	var count = 0;
	while (line[count]=='#') {
		count = count + 1;
	}
	return count-1;
}

function getIndentationLevel(line) {
	var count = 0;
	while (line[count]=='\t') {
		count = count + 1;
	}
	return count+1;
}

function hasExplicitDependencies(line) {
	return /.*@\(([^\)]+)\)/.test(line);
}

function getDependencies(line) {
	const m = line.match(/.*@\(([^\)]+)\)/);
	const text = m[1];
	return text.split(',').map(s=>s.trim());
}

function trimAfter(regex) {
	return (text) => {
		var s = text.search(regex);
		if (s>=0) {text=text.slice(0,s)};
		return text;
	}
}

function getDescription(line) {
	const m = line.match(/\t*(#+|\*|-|\+|[0-9]+\.)\s+([^\s].*)/);
	var descr = m[2].trim();
	descr = trimAfter(/\[[^\]]*\]/)(descr);
	descr = trimAfter(/@\([^\)]*\)/)(descr);
	return descr.trim()
}

module.exports = {
	isHeader,
	isTask,
	getHeaderLevel,
	getIndentationLevel,
	isOrdered,
	hasExplicitDependencies,
	getDependencies,
	getDescription
}