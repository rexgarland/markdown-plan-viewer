
const WHITESPACE = ' \t'
function beginningWhitespaceCharacters(line) {
	var c = line[0]
	if (!WHITESPACE.includes(c)) {return ''}
	var w = '';
	var i = 0;
	while (i<line.length && WHITESPACE.includes(line[i])) {
		w = w + line[i++];
	}
	return w;
}

function mode(arr) {
	if (arr.length===0) {return}
	const vals = {};
	arr.forEach(c=>{
		vals[c] = vals[c] ? vals[c]+1 : 1;
	});
	return Object.keys(vals).reduce((a,v)=>{
		return (vals[v]>vals[a]) ? v : a;
	}, Object.keys(vals)[0]);
}

function gcd(a, b) {
  if (!b) {
    return a;
  }
  return gcd(b, a % b);
}

function inferIndentation(lines) {
	if (lines.length==1) {
		return WHITESPACE.includes(lines[0]) ? lines[0] : '\t';
	}
	// get all the whitespace strings preceding tasks
	const whites = lines.map(beginningWhitespaceCharacters);
	// get the most common character
	const chars = Array.from(whites.reduce((a,v)=>a+v, ''));
	const maxChar = mode(chars);
	// map lines to number of that character
	const counts = lines.map(getIndentationLevel(maxChar));
	console.log(counts);
	// return the gcf of these numbers
	const num = counts.slice(1).reduce((a,v)=>gcd(a,v),counts[0]);
	return Array(num).fill(maxChar).join('')
}

function getIndentationLevel(indent) {
	const n = indent.length
	return (line) => {
		var count = 0;
		while (line.length>=n && line.slice(0,n)==indent) {
			count = count + 1;
			line = line.slice(n);
		}
		return count;
	}
}

module.exports = {
	mode,
	inferIndentation,
	getIndentationLevel
}