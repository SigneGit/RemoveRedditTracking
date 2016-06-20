// ==UserScript==
// @name         Remove affiliate links from Reddit
// @author       /u/Signe_
// @match        https://www.reddit.com/r/*/comments/*/*
// @grant        none
// ==/UserScript==

var links = document.links;
for(var i=0;i<links.length;i++)
{
    if(links[i].hasAttribute("data-affiliate-url"))
    {
        links[i].setAttribute("data-affiliate-url",links[i].href);
        links[i].style.color = "#00FF00";
        //console.log(links[i]);
    }
}


