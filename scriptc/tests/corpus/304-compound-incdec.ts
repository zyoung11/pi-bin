let n = 10;
n += 5;
n -= 3;
n *= 2;
n /= 8;
n %= 2;
console.log(n);
let p = 2;
p **= 8;
console.log(p);

let s = "a";
s += "b";
s += 1 + 1;
s += true;
console.log(s);

let i = 0;
i++;
++i;
i--;
console.log(i);

for (let k = 0; k < 5; k++) {
  if (k % 2 === 0) {
    continue;
  }
  console.log(k);
}
let total = 0;
for (let k = 10; k > 0; k -= 3) {
  total += k;
}
console.log(total);
