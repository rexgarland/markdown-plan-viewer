const { createTree } = require('./parse');

// test('creates a tree from lines with levels', () => {
// 	const linesWithLevels = [
// 		{
// 			line: '# first line',
// 			level: 0
// 		},
// 		{
// 			line: '- second line',
// 			level: 1
// 		}
// 	];
// 	const tree = createTree(linesWithLevels);
// 	const expected = [
// 		'# first line',
// 		[
// 			'- second line'
// 		]
// 	];
// 	expect(tree).toBe([])
// })

// test('object references work as expected', () => {
// 	const obj1 = {};
// 	const obj2 = {};
// 	obj1.ref = obj2;
// 	obj2.ref = obj1;
// 	expect(obj1.ref).toBe(obj2);
// 	expect(obj2.ref).toBe(obj1);
// })

function getNode() {
	const node = {children: []};
	[1,2,3].forEach(i=>{
		const newNode = {i, parent: node};
		node.children.push(newNode);
	});
	return node;
}

test('function returning a node with references', () => {
	const node = getNode();
	expect(node.children[0].parent).toBe(node);
})