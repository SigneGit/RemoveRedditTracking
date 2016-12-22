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
var _ResTest = setInterval(Detect_Res,1000)
var _AffiliateTimer;
var _Counter = 0;
var ChangeColorOnEdit = false;
function Detect_Res() {
    if ($(".neverEndingReddit")[0]){
        clearInterval(_ResTest);
        _AffiliateTimer = setInterval(Affiliate,1000);
    }
    _Counter++;
    if(_Counter >= 5){ 
        clearInterval(_ResTest);
    }
}

function Affiliate() {
  var links = document.links;
  for (var i = 0; i < links.length; i++)
  {
    if (links[i].hasAttribute('data-affiliate-url'))
    {
      //links[i].setAttribute('data-affiliate-url', links[i].href);
      links[i].removeAttribute('data-affiliate-url');
      if(ChangeColorOnEdit)
          links[i].style.color = '#00FF00';
      //console.log(links[i]);
    }
    if (links[i].hasAttribute('data-outbound-url'))
    {
      //links[i].setAttribute('data-outbound-url', links[i].href);
      links[i].removeAttribute('data-outbound-url');
      links[i].removeAttribute('data-outbound-expiration');
      if(ChangeColorOnEdit)
        links[i].style.color = '#00FF00';
      //console.log(links[i]);
    }
    if(links[i].hasAttribute('data-inbound-url'))
    {
        links[i].removeAttribute('data-inbound-url');
        if(ChangeColorOnEdit)
            links[i].style.color = '#00FF00';
    }
  }
}
