const fs = require('fs');
const plan = fs.readFileSync(__dirname + '/app.plan.md', 'utf8');

const { parse } = require('./parse');

var cm = CodeMirror((el) => {el.id = 'codemirror'; document.body.prepend(el)}, {
  value: plan,
  mode:  "markdown",
  lineWrapping: true
});

// batch changes
var timer = undefined;
function batch(timeout, fn) {
  return (...args) => {
    if (timer !== undefined) {
      clearTimeout(timer);
    }
    timer = setTimeout(()=>{
      clearTimeout(timer);
      fn(...args);
    }, timeout);
  }
}

cm.on('change', batch(1000, (inst) => {
  const text = inst.doc.getValue();
  parse(text, (dag,error) => {
    if (error !== null) {
      console.log(error);
    } else {
      console.log(dag);
    }
  })
}));

const text = cm.doc.getValue();
parse(text, (dag,error) => {
    if (error !== null) {
      console.error(error.message);
    } else {
      console.log(dag);
    }
  });