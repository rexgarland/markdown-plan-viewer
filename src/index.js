const fs = require('fs');
const plan = fs.readFileSync(__dirname + '/app.plan.md', 'utf8');
const { parse } = require('./parse');
const { createGraph } = require('./graph');
const _ = require('lodash');

var cm = CodeMirror((el) => {el.id = 'codemirror'; document.body.prepend(el)}, {
  value: plan,
  mode:  "markdown",
  lineWrapping: true
});

const graph = createGraph(document.getElementById('cy'));

var previousDag;
function parseAndDisplay(text) {
  parse(text, (dag,error) => {
    if (error !== null) {
      console.log(error);
    } else {
      if (!_.isEqual(dag, previousDag)) {
        previousDag = _.cloneDeep(dag);
        graph(dag);
      }
    }
  })
}

parseAndDisplay(cm.doc.getValue());

// limit changes
var timer;
function limit(timeout, fn) {
  return (...args) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(()=>{
      clearTimeout(timer);
      fn(...args);
    }, timeout);
  }
}

cm.on('change', limit(2000, (inst)=>parseAndDisplay(inst.doc.getValue())));