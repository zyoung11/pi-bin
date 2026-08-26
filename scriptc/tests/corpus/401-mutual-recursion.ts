function isEven(n: number): boolean {
  if (n === 0) {
    return true;
  }
  return isOdd(n - 1);
}
function isOdd(n: number): boolean {
  if (n === 0) {
    return false;
  }
  return isEven(n - 1);
}
console.log(isEven(10), isOdd(10), isEven(7), isOdd(7));
