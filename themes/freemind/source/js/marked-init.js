
  marked.setOptions({
    highlight: function (code, lang) {
        return hljs.highlightAuto(code).value;
    }
  });
  function Highlighting(){
    var markdowns = document.getElementsByClassName('markdown');
    for(var i=0;i<markdowns.length;i++){
        if(markdowns[i].innerHTML) markdowns[i].innerHTML =marked(markdowns[i].innerHTML);
    }
  }
  window.addEventListener('DOMContentLoaded', Highlighting, false);
  window.addEventListener('load', Highlighting, false);
  