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
var bSetTrending = false;
var bFrontPage = false;
function Detect_Res() { //Detects if res never ending reddit is enabled if not clear timer, if so set timer for RemoveAffiliate
  if ($('.neverEndingReddit') [0]) {
    RemoveAffiliateTimer = setInterval(RemoveAffiliate, 1000); //Never ending reddit is enabled then start a timer
    clearInterval(CheckRes); //Clears the timer on this function (Detect_Res)
  }
  tCounter++;
  if (tCounter >= 5) { //If res never-ending is not found then abort the timer
    clearInterval(CheckRes); //Clears the timer on this function (Detect_Res)
  }
}
function RemoveAffiliate() {
  try {
    if (!bFrontPage) { //Checks if the current page is the frontpage or not
      var FrontPage = document.getElementsByClassName('front-page') [0];
      if (FrontPage != null) {
        bFrontPage = true;
      }
    }
    var links = document.links;
    for (var i = 0; i < links.length; i++) {
      if (links[i].hasAttribute('data-affiliate-url')) { //Removes affiliate links (Reddit removed affiliate links this is technically no longer needed)
        links[i].removeAttribute('data-affiliate-url');
        links[i].removeAttribute('data-event-action');
        links[i].removeAttribute('data-href-url');
        if (ChangeColorOnEdit) {
          links[i].style.color = '#00FF00';
        }
      }
      if (links[i].hasAttribute('data-outbound-url')) { //Removes outbound link tracker
        links[i].removeAttribute('data-outbound-url');
        links[i].removeAttribute('data-outbound-expiration');
        links[i].removeAttribute('data-event-action');
        links[i].removeAttribute('data-href-url');
        if (ChangeColorOnEdit) {
          links[i].style.color = '#00FF00';
        }
      }
      if (links[i].hasAttribute('data-inbound-url')) { //Removes inbound link tracker
        links[i].removeAttribute('data-inbound-url');
        links[i].removeAttribute('data-event-action');
        links[i].removeAttribute('data-href-url');
        if (ChangeColorOnEdit) {
          links[i].style.color = '#00FF00';
        }
      }
    }
    if (bFrontPage && !bSetTrending) { //Removes trending link tracker
      bSetTrending = true; //No reason to constantly rewrite it.
      var Trending = document.getElementsByClassName('trending-subreddits-content') [0].getElementsByTagName('a');
      for (var j = 0; j < 5; j++) {
        Trending[j].href = 'https://www.reddit.com' + Trending[j].innerText;
        if (ChangeColorOnEdit) {
          Trending[j].style.color = '#00FF00';
        }
      }
    }
  }
  catch (err) { //Outputs any errors
    console.log('[RemoveAffiliate] Error: ' + err.message);
  }
}
RemoveAffiliate();
