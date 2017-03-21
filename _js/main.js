// @flow
const start = (s:string):string => `Hi, ${s}`
const end = (s:string):string  => `${s}!`

console.log(
  end(start('dude'))
);
