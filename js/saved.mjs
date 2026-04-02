import { getList, saveList } from "./storage.mjs";
import { state } from "./state.mjs";

function renderStyledText(raw){
  const wrapper=document.createElement("span");

  let color="#fff";
  let bold=false;
  let italic=false;
  let underline=false;
  let superscript=false;

  const regex=/<(#[0-9A-Fa-f]{6})>|<(\/?)(b|i|u|sup)>|(.)/g;
  let match;

  while((match=regex.exec(raw))){
    if(match[1]){
      color=match[1];
    }else if(match[3]){
      const closing=match[2]==="/";

      if(match[3]==="b") bold=!closing;
      if(match[3]==="i") italic=!closing;
      if(match[3]==="u") underline=!closing;
      if(match[3]==="sup") superscript=!closing;
    }else{
      const s=document.createElement("span");
      s.textContent=match[4];
      s.style.color=color;

      if(bold) s.style.fontWeight="700";
      if(italic) s.style.fontStyle="italic";
      if(underline) s.style.textDecoration="underline";
      if(superscript){
        s.style.fontSize="0.65em";
        s.style.verticalAlign="super";
      }

      wrapper.appendChild(s);
    }
  }

  return wrapper;
}

function copy(text,label){
  if(!text)return;
  navigator.clipboard.writeText(text);

  let t=document.querySelector(".toast");

  if(!t){
    t=document.createElement("div");
    t.className="toast";
    document.body.appendChild(t);
  }

  t.textContent=label;
  t.classList.add("show");

  setTimeout(()=>t.classList.remove("show"),1200);
}

export function renderSaved(userList,quipList){
  userList.innerHTML="";
  quipList.innerHTML="";

  const users=getList("gd-users");
  const quips=getList("gd-quips");

  users.forEach(u=>{
    const item=document.createElement("div");
    item.className="saved-item";
    item.appendChild(renderStyledText(u));

    if(state.removeMode){
      const removeX=document.createElement("button");
      removeX.textContent="×";

      removeX.onclick=e=>{
        e.stopPropagation();
        saveList("gd-users",users.filter(x=>x!==u));
        renderSaved(userList,quipList);
      };

      item.appendChild(removeX);
    }

    item.onclick=()=>{
      if(state.removeMode)return;
      copy(u,"Username copied");
    };

    userList.appendChild(item);
  });

  quips.forEach(q=>{
    const item=document.createElement("div");
    item.className="saved-item";
    item.appendChild(renderStyledText(q));

    if(state.removeMode){
      const removeX=document.createElement("button");
      removeX.textContent="×";

      removeX.onclick=e=>{
        e.stopPropagation();
        saveList("gd-quips",quips.filter(x=>x!==q));
        renderSaved(userList,quipList);
      };

      item.appendChild(removeX);
    }

    item.onclick=()=>{
      if(state.removeMode)return;
      copy(q,"Quip copied");
    };

    quipList.appendChild(item);
  });
}