// ==UserScript==
// @name         Remove affiliate links from Reddit
// @author       /u/Signe_
// @match        https://*.reddit.com/*
// @match        https://*.reddit.com/r/*/comments/*/*
// @match        https://*.reddit.com/u/*
// @match        https://*.reddit.com/user/*
// @grant        none
// ==/UserScript==

Affiliate()



if ($(".neverEndingReddit")[0]){
    setInterval(Affiliate,5000)
    console.log("Set Timer")
}



function Affiliate() {
var links = document.links;
for(var i=0;i<links.length;i++)
{
    if(links[i].hasAttribute("data-affiliate-url"))
    {
        links[i].setAttribute("data-affiliate-url",links[i].href);
        links[i].style.color = "#00FF00";
        //console.log(links[i]);
    }
    
    if(links[i].hasAttribute("data-outbound-url"))
    {
        links[i].setAttribute("data-outbound-url",links[i].href);
        links[i].style.color = "#00FF00";
        //console.log(links[i]);
    }
}
}
