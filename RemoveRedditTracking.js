// ==UserScript==
// @name         Remove Reddit Tracking
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
var linksCount = - 1;
var ChangeColorOnEdit = false;
var bSetTrending = false;
var bFrontPage = false;
var bCommentsPage = false;
var EventArray = []; //Array holds the id of the 'load more comments'
function Detect_Res() { //Detects if res never ending reddit is enabled if not clear timer, if so set timer for RemoveAffiliate
  if ($('.neverEndingReddit') [0]) {
    RemoveAffiliateTimer = setInterval(RemoveAffiliate, 1000); //Never ending reddit is enabled then start a timer
    clearInterval(CheckRes); //Clears the timer on this function (Detect_Res)
    console.log('[RemoveAffiliate] NeverEndingReddit detected running timer for new links');
  }
  if (tCounter == 1) {
    RemoveAffiliate();
  }
  tCounter++;
  if (tCounter >= 5) { //If res never-ending is not found then abort the timer
    clearInterval(CheckRes); //Clears the timer on this function (Detect_Res)
    console.log('[RemoveAffiliate] NeverEndingReddit not detected aborting timer');
  }
}
function RemoveAffiliate() { //Actually removes the tracking / affiliates from links
  try {
    if (!bFrontPage) { //Checks if the current page is the frontpage or not
      var FrontPage = document.getElementsByClassName('front-page') [0];
      if (FrontPage != null) {
        bFrontPage = true;
      }
    }
    if (!bCommentsPage && !bFrontPage) { //Checks if the current page is a comments page or not
      var CommentsPage = document.getElementsByClassName('comments') [0];
      if (CommentsPage != null) {
        bCommentsPage = true;
      }
    }
    var links = document.links;
    if (links.length > linksCount) {
      linksCount = links.length;
      for (var i = 0; i < links.length; i++) {
        if (links[i].hasAttribute('data-affiliate-url')) { //Removes affiliate links (Reddit removed affiliate links this is technically no longer needed)
          links[i].removeAttribute('data-affiliate-url');
          links[i].removeAttribute('data-href-url');
          if (ChangeColorOnEdit) {
            links[i].style.color = '#00FF00';
          }
        }
        if (links[i].hasAttribute('data-outbound-url')) { //Removes outbound link tracker
          links[i].removeAttribute('data-outbound-url');
          links[i].removeAttribute('data-outbound-expiration');
          links[i].removeAttribute('data-href-url');
          if (ChangeColorOnEdit) {
            links[i].style.color = '#00FF00';
          }
        }
        if (links[i].hasAttribute('data-inbound-url')) { //Removes inbound link tracker
          links[i].removeAttribute('data-inbound-url');
          links[i].removeAttribute('data-href-url');
          if (ChangeColorOnEdit) {
            links[i].style.color = '#00FF00';
          }
        }
        if (links[i].hasAttribute('data-event-action')) { //Removes event tracker
          links[i].removeAttribute('data-event-action');
          if (ChangeColorOnEdit) {
            links[i].style.color = '#00FF00';
          }
        }        //Change 'load more comments' to whatever your language equivalent is

        if (links[i].innerText.includes('load more comments') && bCommentsPage) { //Add event listener to the load more comments button
          var found = false;
          for (var j = 0; j < EventArray.length; j++) {
            if (EventArray[i] == 'links[i].id') {
              found = true; //If the id is found then don't re-add the event listener
              break;
            }
          }
          if (!found) {
            links[i].addEventListener('click', DelayCheck);
            EventArray.push(links[i].id);
          }
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
var DelayCheckTimeOut = 0;
var DelayCheckCount = - 1;
var DelayCheck = function () { //This is a function to delay a Affiliate check (used when you click 'load more comments')
  var links = document.links;
  if (links.length > DelayCheckCount && DelayCheckCount != - 1) {
    RemoveAffiliate();
    DelayCheckCount = - 1; //Forces a 1 second delay when this function gets called
    DelayCheckTimeOut = 0; //Reset the timeout
  } 
  else {
    if (DelayCheckTimeOut <= 8) { //No reason for this method to continue calling itself after 8 seconds.
      DelayCheckCount = links.length;
      DelayCheckTimeOut++;
      setTimeout(DelayCheck, 1000); //Call to itself every 1 second
    }
    else{
      DelayCheckTimeOut = 0; //resets the timer
    }
  }
}
