function res(a, b, result, carry, sign){
//   console.log('return resNeg(%s, %s, %s, %s)', a, b, result, carry);
  if(a.length == 0 && b.length == 0 && !carry)
    return result;
    
  var l = parseInt(a.pop() || '0') + sign * parseInt(b.pop() || '0') + (carry || 0);
  
  var c = 0;
  if (l < 0)
  {
    l = 9;
    c = -1;
  }
  else if (l > 9)
  {
    c = 1;
    l -= 10;
  }
  l = l + (result || '');
  
  return res(a, b, l, c, sign);
}

function add(a, b) {
    var bStr = b.toString();
    var sign = 1;
    if (b < 0)
    {
        sign = -1;
        bStr = bStr.substr(1);
    }
    return res(a.toString().split(''), bStr.split(''), '', 0, sign).toString();
}

module.exports = {
    add: add
};