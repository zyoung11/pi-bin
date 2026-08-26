// The suite-harness keyed-write shape: an untyped module `let` holding an
// object BUILT UP through runtime keys (`catchWarning[nameOrMap] = fn`),
// closure values crossing into the checked-dynamic tree, and the dyn-keyed read calling
// them back (`catchWarning[warning.name](warning)`) — plus the map arm's
// Object.keys walk writing through a loop variable key.
'use strict';
function _expectWarning(name, expected, code) {
  return (warning) => {
    console.log('handled', warning.name, expected, code);
  };
}

let catchWarning;
let dispatch;

function expectWarning(nameOrMap, expected, code) {
  if (catchWarning === undefined) {
    catchWarning = {};
    dispatch = (warning) => {
      if (!catchWarning[warning.name]) {
        throw new TypeError(`"${warning.name}" was triggered without being expected.`);
      }
      catchWarning[warning.name](warning);
    };
  }
  if (typeof nameOrMap === 'string') {
    catchWarning[nameOrMap] = _expectWarning(nameOrMap, expected, code);
  } else {
    Object.keys(nameOrMap).forEach((name) => {
      catchWarning[name] = _expectWarning(name, nameOrMap[name]);
    });
  }
}

expectWarning('DeprecationWarning', 'going away', 'DEP0005');
expectWarning({ ExperimentalWarning: 'try me' });
dispatch({ name: 'DeprecationWarning' });
dispatch({ name: 'ExperimentalWarning' });
try {
  dispatch({ name: 'Unexpected' });
} catch (e) {
  console.log('caught:', e.message);
}
console.log('done');
