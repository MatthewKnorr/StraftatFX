import { compactOutput } from "./formatter.mjs";
import { getList, saveList, state } from "./state.mjs";
import { renderFormattedOutput } from "./render.mjs";

function renderStyledText(raw) {
  const wrapper = document.createElement("span");
  wrapper.className = "saved-text-content";
  wrapper.innerHTML = renderFormattedOutput(compactOutput(raw), { showTags: false });
  return wrapper;
}

function renderRemoveButton(onRemove){
  const removeX=document.createElement("button");
  removeX.className="saved-remove-btn";
  removeX.innerHTML='<i class="fa-solid fa-trash" aria-hidden="true"></i>';
  removeX.type="button";
  removeX.title="Remove saved item";
  removeX.setAttribute("aria-label", "Remove saved item");
  removeX.onclick=e=>{
    e.stopPropagation();
    onRemove();
  };
  return removeX;
}

export function renderSaved(quipList, { onAfterChange = () => {} } = {}) {
  if (!quipList) return;
  quipList.innerHTML = "";
  const quips = getList("gd-quips");

  quips.forEach(q=>{
    const item=document.createElement("div");
    item.className="saved-item saved-item-clipboard";
    item.appendChild(renderStyledText(q));

    item.appendChild(renderRemoveButton(()=>{
      saveList("gd-quips",quips.filter(x=>x!==q));
      renderSaved(quipList, { onAfterChange });
      onAfterChange();
    }));

    const feedback = document.createElement("span");
    feedback.className = "arsenal-copy-feedback";
    feedback.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
    feedback.setAttribute("aria-live", "polite");
    item.appendChild(feedback);
    item.tabIndex = state.removeMode ? -1 : 0;
    if (!state.removeMode) {
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", "Copy saved text");
    }
    let feedbackTimer;
    item.onclick = async () => {
      if (state.removeMode) return;
      try {
        await navigator.clipboard.writeText(compactOutput(q));
        feedback.textContent = "\u2713 COPIED";
        item.classList.add("copied");
      } catch {
        feedback.textContent = "Copy failed";
        item.classList.add("copied");
      }
      clearTimeout(feedbackTimer);
      feedbackTimer = setTimeout(() => {
        item.classList.remove("copied");
        feedback.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
      }, 1200);
    };
    item.onkeydown = event => {
      if (event.target !== item || !["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      item.click();
    };

    quipList?.appendChild(item);
  });
}
