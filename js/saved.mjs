import { getList, saveList } from "./storage.mjs";
import { state } from "./state.mjs";
import { normalizeHex } from "./gradient.mjs";

function renderStyledText(raw){
  const wrapper=document.createElement("span");
  wrapper.className="saved-text-content";

  let color="#fff";
  let bold=false;
  let italic=false;
  let underline=false;
  let superscript=false;

  const regex=/<(#[0-9A-Fa-f]{3}(?:[0-9A-Fa-f]{3})?)>|<(\/?)(b|i|u|sup)>|(.)/g;
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

function gradientSignature(colors){
  return colors.map(normalizeHex).join("|");
}

function renderGradient(colors){
  const wrapper=document.createElement("div");
  wrapper.className="saved-gradient";

  const preview=document.createElement("div");
  preview.className="saved-gradient-preview";
  preview.style.background=colors.length===1
    ? colors[0]
    : `linear-gradient(90deg, ${colors.join(", ")})`;

  const label=document.createElement("div");
  label.className="saved-gradient-label";
  label.textContent=`${colors.length} Color${colors.length===1?"":"s"}`;

  wrapper.appendChild(preview);
  wrapper.appendChild(label);

  return wrapper;
}

function renderRemoveButton(onRemove){
  const removeX=document.createElement("button");
  removeX.innerHTML="&times;";
  removeX.onclick=e=>{
    e.stopPropagation();
    onRemove();
  };
  return removeX;
}

export function renderSaved(quipList,gradientList,options={}){
  const {
    onApplyGradient=()=>({ ok:true }),
    onGradientError=()=>{},
    onAfterChange=()=>{}
  }=options;

  if(quipList) quipList.innerHTML="";
  if(gradientList) gradientList.innerHTML="";

  const quips=getList("gd-quips");
  const gradients=getList("gd-gradients");

  gradients.forEach(entry=>{
    const colors=Array.isArray(entry?.colors) ? entry.colors : Array.isArray(entry) ? entry : [];
    if(!colors.length) return;

    const item=document.createElement("div");
    item.className="saved-item saved-item-gradient";
    item.appendChild(renderGradient(colors));

    if(state.removeMode){
      item.appendChild(renderRemoveButton(()=>{
        saveList("gd-gradients",gradients.filter(x=>{
          const entryColors=Array.isArray(x?.colors) ? x.colors : Array.isArray(x) ? x : [];
          return gradientSignature(entryColors)!==gradientSignature(colors);
        }));
        renderSaved(quipList,gradientList,options);
        onAfterChange();
      }));
    }

    item.onclick=()=>{
      if(state.removeMode)return;

      const result=onApplyGradient(colors);

      if(result?.ok===false){
        onGradientError(result.message || "Need more text for this gradient");
      }
    };

    gradientList?.appendChild(item);
  });

  quips.forEach(q=>{
    const item=document.createElement("div");
    item.className="saved-item saved-item-clipboard";
    item.appendChild(renderStyledText(q));

    if(state.removeMode){
      item.appendChild(renderRemoveButton(()=>{
        saveList("gd-quips",quips.filter(x=>x!==q));
        renderSaved(quipList,gradientList,options);
        onAfterChange();
      }));
    }

    item.onclick=()=>{
      if(state.removeMode)return;
      navigator.clipboard.writeText(q);

      let t=document.querySelector(".toast");

      if(!t){
        t=document.createElement("div");
        t.className="toast";
        document.body.appendChild(t);
      }

      t.textContent="Clipboard copied";
      t.classList.add("show");

      setTimeout(()=>t.classList.remove("show"),1200);
    };

    quipList?.appendChild(item);
  });
}
