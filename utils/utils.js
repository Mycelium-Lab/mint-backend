const noDup = (data) => { // форматирует запрос их массива событий mint в объект с id кошелька в качетсве ключа
    //console.log(data.mints);          // Если хочешь сохранить свою психику даже не пытайся разобраться
    let newObject = {};
    data.mints.map(element => {
      if (!(element.origin in newObject)) {
        newObject[element.origin] = {totalAmount:parseFloat(0),data:[], active:0, length:0};
      }
      newObject[element.origin].totalAmount = newObject[element.origin].totalAmount + parseFloat(element.amountUSD); 
      newObject[element.origin].active +=1;
      newObject[element.origin].pools = [];
      if(!newObject[element.origin].pools.includes(element.pool.id))
        newObject[element.origin].pools.push(element.pool.id)
      newObject[element.origin].length +=1;
      newObject[element.origin].data.push({ // я предупреждал
        date:element.timestamp,
        token0: element.token0.symbol,
        token1: element.token1.symbol,
        amountUSD: element.amountUSD,
        flag: 1
      })
  
      for (let burn of element.transaction.burns) {
        //console.log(element.to);
        newObject[element.origin].length +=1;
        if ((parseFloat(element.amountUSD) - parseFloat(burn.amountUSD)) < parseFloat(1000)) {
          newObject[element.origin].active -= 1;
          //console.log(parseFloat(element.amountUSD) - parseFloat(burn.amountUSD));
        }
        
        newObject[element.origin].data.push({
        date: burn.timestamp,
        token0: burn.token0.symbol,
        token1: burn.token1.symbol,
        amountUSD: burn.amountUSD,
        flag: 0
      })
      }
    });
    return newObject;
  }
const noDupToArray = (noDup) => {
    return Object.keys(noDup).map((addressKey) => {
        return {
            address: addressKey, 
            totalAmount: noDup[addressKey].totalAmount, 
            active: noDup[addressKey].active, 
            length: noDup[addressKey].length, 
            pools: noDup[addressKey].pools,
            data: noDup[addressKey].data
        };
    });
}
const converMintsToAddressArray = (mints) => {
    return noDupToArray(noDup(mints));
}
  export default{
    converMintsToAddressArray: converMintsToAddressArray
  }