const {
	mode,
	getIndentationLevel,
	inferIndentation
} = require('./stringUtils');

test('indentation level', () => {
	const indent = '  '
	expect(getIndentationLevel(indent)('-')).toBe(0)
	expect(getIndentationLevel(indent)('  -')).toBe(1)
	expect(getIndentationLevel(indent)('    -')).toBe(2)
})

test('mode', () => {
	expect(mode([' ',' ','\t'])).toBe(' ')
})

test('inferring indentation', () => {
	var lines = [
		'- task',
		'  - task',
		'  - task',
		'    - task'
	]
	expect(inferIndentation(lines)).toBe('  ');
	var lines = [
		'- task',
		' - task',
		'  - task',
		'  - task'
	]
	expect(inferIndentation(lines)).toBe(' ');
	var lines = [
		'\t- task',
		'- task',
		'\t - task',
		'\t\t- task'
	]
	expect(inferIndentation(lines)).toBe('\t');
})