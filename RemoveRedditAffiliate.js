// ==UserScript==
// @name         Remove affiliate links from Reddit
// @author       /u/Signe_
// @match        https://*.reddit.com/*
// @match        https://*.reddit.com/r/*/comments/*/*
// @match        https://*.reddit.com/u/*
// @match        https://*.reddit.com/user/*
// @grant        none
// ==/UserScript==
var CheckRes = setInterval(Detect_Res, 1000);
var RemoveAffiliateTimer;
var tCounter = 0;
var ChangeColorOnEdit = false;
function Detect_Res() {
  if ($('.neverEndingReddit') [0]) {
    clearInterval(CheckRes);
    RemoveAffiliateTimer = setInterval(RemoveAffiliate, 1000);
  }
  tCounter++;
  if (tCounter >= 5) {
    clearInterval(CheckRes);
  }
}
function RemoveAffiliate() {
  try {
    var links = document.links;
    for (var i = 0; i < links.length; i++)
    {
      if (links[i].hasAttribute('data-affiliate-url'))
      {
        links[i].removeAttribute('data-affiliate-url');
        if (ChangeColorOnEdit) {
          links[i].style.color = '#00FF00';
        }
      }
      if (links[i].hasAttribute('data-outbound-url'))
      {
        links[i].removeAttribute('data-outbound-url');
        links[i].removeAttribute('data-outbound-expiration');
        if (ChangeColorOnEdit) {
          links[i].style.color = '#00FF00';
        }
      }
      if (links[i].hasAttribute('data-inbound-url'))
      {
        links[i].removeAttribute('data-inbound-url');
        if (ChangeColorOnEdit) {
          links[i].style.color = '#00FF00';
        }
      }
    }
  } 
  catch (err) {
    console.log('[RemoveAffiliate] Error: ' + err.message);
  }
}
RemoveAffiliate();
