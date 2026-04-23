    // add authorization
    // const originalList = ['AAFM', 'AAI', 'AAII', 'ABJI', 'ABSM', 'ACBM', 'ACJM', 'ALKI', 'ALTI', 'AMPM']; 
    // Normalize the list to a Set of lowercase strings for efficient lookup
    
    export function  checkAuthorizationByStaCode(originalList, code){
    const lowercaseSet = new Set(originalList.map(item => item.toLowerCase()));

    // const wordToCheck = 'Grape';
    const lowercaseWord = (code || "").toLowerCase();

    // Check if the lowercase word is NOT in the set
    if (!lowercaseSet.has(lowercaseWord)) {
      console.log(`"${code}" is not in the list.`);
      throw new Error(`"${code}" is not in the list.`);
        
    } else {
      console.log(`"${code}" is in the list.`);
      return ;
    }
}


export function checkAuthorizationByStaId(originalList, stationId){
    // 1. Make sure it's not an empty string
    // 2. Check if the string version of the array items matches your stationId
    const isAuthorized = stationId.trim() !== "" && originalList.some(id => String(id) === String(stationId.trim()));

    // Check if the lowercase word is NOT in the set
    if (!isAuthorized) {
      console.log(`"${stationId}" is not in the list.`);
      throw new Error(`"${stationId}" is not in the list.`);
        // return false;
    } else {
      console.log(`"${stationId}" is in the list.`);
      return  
    }
}