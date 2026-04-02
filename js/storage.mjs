export function getList(key){
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

export function saveList(key, data){
  localStorage.setItem(key, JSON.stringify(data));
}