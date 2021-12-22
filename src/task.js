const assert = require('assert');
const { DateTime } = require("luxon");

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

function hasExplicitDependencies(line) {
	return /.*@\(([^\)]+)\)/.test(line);
}

function getDependencies(line) {
	const m = line.match(/.*@\(([^\)]+)\)/);
	return !!m ? m[1].split(',').map(s=>s.trim()) : undefined;
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

const ESTIMATES = { // in days
	".": 0.5,
	"..": 2,
	"...": 5,
};

function getWorkEstimate(line) {
	const m = line.match(/\[(\.+)\]/);
	return !!m ? ESTIMATES[m[1]] : undefined;
}

function getWaitEstimate(line) {
	const m = line.match(/\[wait (\.+)\]/);
	return !!m ? ESTIMATES[m[1]] : undefined;
}

function getEstimate(line) {
	var e = getWorkEstimate(line);
	if (e) { return e; }
	e = getWaitEstimate(line);
	if (e) { return e; }
	return;
}

function getType(line) {
	var e = getWorkEstimate(line);
	if (e) { return 'work'; }
	e = getWaitEstimate(line);
	if (e) { return 'wait'; }
	return;
}

const MEASUREMENTS = { // in days
	"h": 1/8,
	"a": 0.5,
	"d": 1
};

function getMeasurement(line) {
	const m = line.match(/\[([had]+)\]/);
	return !!m ? Array.from(m[1]).map(c=>MEASUREMENTS[c]).reduce((a,v)=>a+v,0) : undefined;
}

function count(str, char) {
	return Array.from(str).reduce((a,v)=>a+(v===char),0);
}

function guessYear(isoPartial) {
	const now = DateTime.now();
	const thisYear = now.year;
	const d = [DateTime.fromISO(`${thisYear}-${isoPartial}`)];
	if (d[0]>now) {
		d.unshift(DateTime.fromISO(`${thisYear-1}-${isoPartial}`));
	} else {
		d.push(DateTime.fromISO(`${thisYear+1}-${isoPartial}`));
	}
	const percentOfYear = (now-d[0])/(365*24*60*60*1000);
	return (percentOfYear<0.2) ? d[0] : d[1]; // arbitrary choice: 20% of the year is considered "looking at next year"
}

function padDateDigits(str) {
	return str.split('-').map(s=>s.padStart(2,0)).join('-');
}

function getDeadline(line) {
	const m = line.match(/\[by ([0-9]+(-[0-9]+){1,2})\]/);
	if (!m) { return };
	var str = m[1];
	str = padDateDigits(str);
	if (count(str, '-')===1) { return guessYear(str); }
	return DateTime.fromISO(str);
}

function getCompletion(line) {
	const m = line.match(/\[done\]/);
	if (m) {
		return true
	}
}

module.exports = {
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
}