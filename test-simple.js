const text = '完成2,300万美元A轮融资';
const pattern = /完成[^。]*?([A-Z])\+?轮融资/i;

console.log('测试文本:', text);
console.log('正则匹配:', pattern.test(text));

const match = text.match(pattern);
console.log('匹配结果:', match);

if (match) {
  const letterMatch = match[0].match(/([A-Z])\+?轮/i);
  console.log('字母匹配:', letterMatch);
  if (letterMatch) {
    const letter = letterMatch[1];
    const hasPlus = match[0].includes('+');
    const stage = hasPlus ? `${letter.toUpperCase()}+` : `${letter.toUpperCase()}轮`;
    console.log('最终轮次:', stage);
  }
}
