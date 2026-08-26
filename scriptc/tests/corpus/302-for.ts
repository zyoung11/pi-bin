for (let i = 0; i < 5; i = i + 1) {
  console.log(i);
}
let total = 0;
for (let i = 1; i <= 10; i = i + 1) {
  for (let j = 1; j <= 10; j = j + 1) {
    total = total + i * j;
  }
}
console.log(total);
// shadowing: each loop's i is distinct
const i = 99;
for (let i = 0; i < 2; i = i + 1) {
  const doubled = i * 2;
  console.log(doubled);
}
console.log(i);
