const {
	getDescription
} = require('./task');

test('get description', () => {
	expect(getDescription('- this is a task [by 12-1]')).toBe('this is a task');
})