export const state = {
  colors: ["#0F9", "#FF7A00"],
  colorLocks: [false, false, false, false],
  mode: 5,
  removeMode: false
};

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
