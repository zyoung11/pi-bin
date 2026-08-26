// Division and remainder are IEEE doubles: x % 0 is NaN, remainder takes the DIVIDEND's sign (7 % -3 is 1), constant-folded or not.
console.log(0 / 0);
console.log(1 / 0);
console.log(-1 / 0);
console.log(5 % 0);
console.log(5.5 % 2);
console.log(-7 % 3);
console.log(7 % -3);
console.log(1 / 3);
console.log(10 / 4);
