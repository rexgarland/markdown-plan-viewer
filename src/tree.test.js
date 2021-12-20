const { convertListToTree } = require('./tree');

test('converts a simple list to a tree', () => {
	const list = [
		{value: 'a', level: 0},
		{value: 'b', level: 1},
		{value: 'c', level: 1}
	];
	const tree = convertListToTree(list);

	const expected = {value: 'a', children: []};
	const c1 = {value: 'b', parent: expected};
	expected.children.push(c1);
	const c2 = {value: 'c', parent: expected};
	expected.children.push(c2);

	expect(tree).toBeDefined();
	expect(tree.children).toBeDefined();
	expect(tree.children[0]).toEqual(c1);
	expect(tree.children[1]).toEqual(c2);
	expect(tree.children[0].parent).toEqual(tree);
	expect(tree).toEqual(expected);

})

test('converts a complicated list to a tree', () => {
	const list = [
		{value: 'a', level: 0},
		{value: 'b', level: 1}, // c1
		{value: 'c', level: 2}, // c2
		{value: 'd', level: 3}, // c3
		{value: 'e', level: 1}, // c4
	];
	const root = convertListToTree(list);

	const expected = {value: 'a', children: []};
	const c1 = {value: 'b', parent: expected, children: []};
	expected.children.push(c1);
	const c2 = {value: 'c', parent: c1, children: []};
	c1.children.push(c2);
	const c3 = {value: 'd', parent: c2};
	c2.children.push(c3);
	const c4 = {value: 'e', parent: expected};
	expected.children.push(c4);

	expect(root).toBeDefined();
	expect(root.parent).toBeUndefined();
	expect(root.children).toBeDefined();
	expect(root.children[0]).toEqual(c1);
	expect(root.children[1]).toEqual(c4);
	expect(root.children[0].children[0]).toEqual(c2);
	expect(root.children[0].children[0].children[0]).toEqual(c3);
	expect(root.children[0].parent).toEqual(root);
	expect(root).toEqual(expected);

})